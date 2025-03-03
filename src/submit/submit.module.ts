import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DbRepo } from "../repo/entities/repo.entity";
import { DbRepoToUserSubmissions } from "../repo/entities/repo.to.user.submissions.entity";
import { SubmitService } from "./submit.service";
import { RepoSubmitController } from "./repo-submit.controller";
import { RepoModule } from "../repo/repo.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DbRepo,
      DbRepoToUserSubmissions,
    ], "ApiConnection"),
    RepoModule,
  ],
  controllers: [RepoSubmitController],
  providers: [SubmitService],
  exports: [SubmitService],
})
export class SubmitModule {}
