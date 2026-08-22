# Cognito User Pool (IaC)

Plantilla CloudFormation (`cognito-user-pool.yml`) que provisiona el User Pool
de autenticación de Migraine Control API junto con sus tres triggers Lambda.

## Recursos que crea

- **`AWS::Cognito::UserPool`**: login por email, password policy (mínimo 8
  caracteres, mayúscula, minúscula y número), recuperación de cuenta por
  email verificado, MFA desactivado por defecto.
- **`AWS::Cognito::UserPoolClient`**: cliente público (sin secret) con flujos
  `USER_PASSWORD_AUTH`, `USER_SRP_AUTH` y refresh token habilitados.
- **3 `AWS::Lambda::Function`** (una por trigger) + un rol de ejecución
  compartido con permisos básicos de CloudWatch Logs.
- **3 `AWS::Lambda::Permission`**: autorizan a `cognito-idp.amazonaws.com` a
  invocar cada función, restringido por `SourceArn` al User Pool creado.

## Triggers

| Trigger             | Handler                                                 | Código                        | Responsabilidad                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pre-SignUp          | `src/infra/aws/cognito-triggers/pre-sign-up.ts`         | `pre-sign-up.handler`         | Bloquea dominios de email no permitidos; auto-confirma y auto-verifica únicamente cuando el alta viene de `PreSignUp_AdminCreateUser` (alta administrativa). El self-signup normal sigue el flujo estándar de confirmación por email de Cognito. |
| Post-Confirmation   | `src/infra/aws/cognito-triggers/post-confirmation.ts`   | `post-confirmation.handler`   | Se ejecuta tras `PostConfirmation_ConfirmSignUp`. Punto de extensión para provisionar el usuario en la base de datos de la API (hoy solo registra el evento).                                                                                    |
| Post-Authentication | `src/infra/aws/cognito-triggers/post-authentication.ts` | `post-authentication.handler` | Se ejecuta en cada login exitoso. Punto de extensión para auditoría/último acceso (hoy solo registra el evento).                                                                                                                                 |

Los tres handlers son funciones puras `(event) => Promise<event>` que reciben
y devuelven el evento del trigger sin mutar su forma, tal como exige el
contrato de Cognito Lambda triggers.

## Despliegue

1. Compilar y empaquetar los triggers:

   ```bash
   npm run build
   cd dist/infra/aws/cognito-triggers && zip -r ../../../../cognito-triggers.zip . && cd -
   ```

2. Subir el zip a S3:

   ```bash
   aws s3 cp cognito-triggers.zip s3://<bucket>/cognito-triggers/<version>.zip
   ```

3. Desplegar el stack:

   ```bash
   aws cloudformation deploy \
     --template-file infra/cloudformation/cognito-user-pool.yml \
     --stack-name migraine-control-cognito-dev \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides \
       Stage=dev \
       LambdaCodeS3Bucket=<bucket> \
       LambdaCodeS3Key=cognito-triggers/<version>.zip
   ```

4. Los `Outputs` del stack (`UserPoolId`, `UserPoolClientId`, `UserPoolArn`)
   se usan para configurar `AWS_REGION` y las variables de Cognito en el
   backend/cliente (pendiente de añadir a `src/config/env.ts` cuando se
   integre la verificación de tokens en la API).

## Notas

- Repetir el despliegue por entorno (`Stage=dev|staging|prod`) generando un
  stack independiente por cada uno.
- El rol de ejecución solo tiene permisos de logging (`AWSLambdaBasicExecutionRole`);
  si un trigger necesita acceso a la base de datos u otros servicios AWS,
  ampliar su policy de forma específica en vez de usar permisos amplios.
