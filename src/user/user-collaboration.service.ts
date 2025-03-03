import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository, SelectQueryBuilder } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { PageDto } from "../common/dtos/page.dto";
import { PageMetaDto } from "../common/dtos/page-meta.dto";

import { DbUserCollaboration } from "./entities/user-collaboration.entity";
import { PageOptionsDto } from "../common/dtos/page-options.dto";

@Injectable()
export class UserCollaborationService {
  constructor (
    @InjectRepository(DbUserCollaboration, "ApiConnection")
    private userCollaborationRepository: Repository<DbUserCollaboration>,
  ) {}

  baseQueryBuilder (): SelectQueryBuilder<DbUserCollaboration> {
    const builder = this.userCollaborationRepository.createQueryBuilder("user_collaborations");

    return builder;
  }

  async findOneById (id: string): Promise<DbUserCollaboration> {
    const queryBuilder = this.baseQueryBuilder();

    queryBuilder.where("user_collaborations.id = :id", { id });

    const item: DbUserCollaboration | null = await queryBuilder.getOne();

    if (!item) {
      throw (new NotFoundException);
    }

    return item;
  }

  async addUserCollaboration (userCollaboration: Partial<DbUserCollaboration>) {
    return this.userCollaborationRepository.save(userCollaboration);
  }

  async updateUserCollaboration (id: string, userCollaboration: Partial<DbUserCollaboration>) {
    return this.userCollaborationRepository.update(id, userCollaboration);
  }

  async removeUserCollaboration (id: string) {
    return this.userCollaborationRepository.softDelete(id);
  }

  async findAllUserCollaborations (
    pageOptionsDto: PageOptionsDto,
    userId: number,
  ): Promise<PageDto<DbUserCollaboration>> {
    const queryBuilder = this.baseQueryBuilder();

    queryBuilder
      .innerJoinAndSelect("user_collaborations.user", "user")
      .innerJoinAndSelect("user_collaborations.request_user", "request_user")
      .where("user_collaborations.user_id = :userId", { userId })
      .orderBy("user_collaborations.updated_at", "DESC");

    queryBuilder
      .offset(pageOptionsDto.skip)
      .limit(pageOptionsDto.limit);

    const itemCount = await queryBuilder.getCount();
    const entities = await queryBuilder.getMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }
}
