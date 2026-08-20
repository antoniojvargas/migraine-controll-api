export interface QueryBuilderMock {
  leftJoinAndSelect: jest.Mock;
  innerJoin: jest.Mock;
  innerJoinAndSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  groupBy: jest.Mock;
  addGroupBy: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  getOne: jest.Mock;
  getMany: jest.Mock;
  getRawMany: jest.Mock;
}

export function createQueryBuilderMock(
  handlers: { getOne?: unknown; getMany?: unknown; getRawMany?: unknown } = {},
): QueryBuilderMock {
  const query: QueryBuilderMock = {} as QueryBuilderMock;
  const chain = (): QueryBuilderMock => query;
  query.leftJoinAndSelect = jest.fn(chain);
  query.innerJoin = jest.fn(chain);
  query.innerJoinAndSelect = jest.fn(chain);
  query.where = jest.fn(chain);
  query.andWhere = jest.fn(chain);
  query.orderBy = jest.fn(chain);
  query.groupBy = jest.fn(chain);
  query.addGroupBy = jest.fn(chain);
  query.select = jest.fn(chain);
  query.addSelect = jest.fn(chain);
  query.getOne = jest.fn(async () => handlers.getOne ?? null);
  query.getMany = jest.fn(async () => handlers.getMany ?? []);
  query.getRawMany = jest.fn(async () => handlers.getRawMany ?? []);
  return query;
}
