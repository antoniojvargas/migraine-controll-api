export interface TerraWebhookDataItemDto {
  metadata?: {
    start_time?: string;
    end_time?: string;
  };
  [key: string]: unknown;
}

export interface TerraWebhookPayloadDto {
  type: string;
  user?: {
    user_id?: string;
    provider?: string;
  };
  data?: TerraWebhookDataItemDto[];
}
