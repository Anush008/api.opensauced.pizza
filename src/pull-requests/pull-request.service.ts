import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { DbPullRequest } from "./entities/pull-request.entity";
import { PageMetaDto } from "../common/dtos/page-meta.dto";
import { PageDto } from "../common/dtos/page.dto";
import { OrderDirectionEnum } from "../common/constants/order-direction.constant";
import { PageOptionsDto } from "../common/dtos/page-options.dto";
import { PullRequestPageOptionsDto } from "./dtos/pull-request-page-options.dto";
import { RepoFilterService } from "../common/filters/repo-filter.service";
import { InsightFilterFieldsEnum } from "../insight/dtos/insight-options.dto";
import { DbPullRequestContributor } from "./dtos/pull-request-contributor.dto";
import { PullRequestContributorOptionsDto } from "./dtos/pull-request-contributor-options.dto";

@Injectable()
export class PullRequestService {
  constructor (
    @InjectRepository(DbPullRequest, "ApiConnection")
    private pullRequestRepository: Repository<DbPullRequest>,
    private filterService: RepoFilterService,
  ) {}

  baseQueryBuilder () {
    const builder = this.pullRequestRepository.createQueryBuilder("pull_requests");

    return builder;
  }

  async findAll (
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<DbPullRequest>> {
    const queryBuilder = this.baseQueryBuilder();

    queryBuilder
      .addOrderBy(`"pull_requests"."updated_at"`, OrderDirectionEnum.DESC)
      .offset(pageOptionsDto.skip)
      .limit(pageOptionsDto.limit);

    const itemCount = await queryBuilder.getCount();
    const entities = await queryBuilder.getMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async findAllByContributor (
    contributor: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<DbPullRequest>> {
    const queryBuilder = this.baseQueryBuilder();
    const range = pageOptionsDto.range!;

    queryBuilder
      .innerJoin("repos", "repos", `"pull_requests"."repo_id"="repos"."id"`)
      .where(`LOWER("pull_requests"."author_login")=:contributor`, { contributor: contributor.toLowerCase() })
      .andWhere(`now() - INTERVAL '${range} days' <= "pull_requests"."updated_at"`)
      .addSelect("repos.full_name", "pull_requests_full_name")
      .addSelect("repos.id", "pull_requests_repo_id")
      .orderBy(`"pull_requests"."updated_at"`, OrderDirectionEnum.DESC)
      .offset(pageOptionsDto.skip)
      .limit(pageOptionsDto.limit);

    const itemCount = await queryBuilder.getCount();
    const entities = await queryBuilder.getMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async findAllWithFilters (
    pageOptionsDto: PullRequestPageOptionsDto,
  ): Promise<PageDto<DbPullRequest>> {
    const queryBuilder = this.baseQueryBuilder();
    const range = pageOptionsDto.range!;

    queryBuilder
      .innerJoin("repos", "repos", `"pull_requests"."repo_id"="repos"."id"`)
      .addSelect("repos.full_name", "pull_requests_full_name")
      .addSelect("repos.id", "pull_requests_repo_id");

    const filters = this.filterService.getRepoFilters(pageOptionsDto, range);

    filters.push([`now() - INTERVAL '${range} days' <= "pull_requests"."updated_at"`, {}]);

    if (pageOptionsDto.contributor) {
      filters.push([`LOWER("pull_requests"."author_login")=:contributor`, { contributor: decodeURIComponent(pageOptionsDto.contributor.toLowerCase()) }]);
    }

    if (pageOptionsDto.status) {
      filters.push([`(LOWER("pull_requests"."state")=:status)`, { status: pageOptionsDto.status.toUpperCase() }]);
    }

    this.filterService.applyQueryBuilderFilters(queryBuilder, filters);

    if (pageOptionsDto.filter === InsightFilterFieldsEnum.Recent) {
      queryBuilder
        .orderBy(`"repos"."updated_at"`, "DESC");
    }

    queryBuilder
      .addOrderBy(`"pull_requests"."updated_at"`, OrderDirectionEnum.DESC)
      .offset(pageOptionsDto.skip)
      .limit(pageOptionsDto.limit);

    const itemCount = await queryBuilder.getCount();
    const entities = await queryBuilder.getMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async findAllContributorsWithFilters (
    pageOptionsDto: PullRequestContributorOptionsDto,
  ): Promise<PageDto<DbPullRequestContributor>> {
    const queryBuilder = this.pullRequestRepository.manager.createQueryBuilder();
    const range = pageOptionsDto.range!;

    queryBuilder
      .from(DbPullRequest, "pull_requests")
      .distinct()
      .select("pull_requests.author_login", "author_login")
      .addSelect("MAX(pull_requests.updated_at)", "updated_at")
      .innerJoin("repos", "repos", `"pull_requests"."repo_id"="repos"."id"`)
      .addGroupBy("author_login");

    const filters = this.filterService.getRepoFilters(pageOptionsDto, range);

    filters.push([`now() - INTERVAL '${range} days' <= "pull_requests"."updated_at"`, {}]);

    this.filterService.applyQueryBuilderFilters(queryBuilder, filters);

    const subQuery = this.pullRequestRepository.manager.createQueryBuilder()
      .from(`(${queryBuilder.getQuery()})`, "subquery_for_count")
      .setParameters(queryBuilder.getParameters())
      .select("count(author_login)");

    const countQueryResult = await subQuery.getRawOne<{ count: number }>();
    const itemCount = parseInt(`${countQueryResult?.count ?? "0"}`, 10);

    queryBuilder
      .addOrderBy(`"updated_at"`, OrderDirectionEnum.DESC)
      .offset(pageOptionsDto.skip)
      .limit(pageOptionsDto.limit);

    const entities: DbPullRequestContributor[] = await queryBuilder.getRawMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }
}
