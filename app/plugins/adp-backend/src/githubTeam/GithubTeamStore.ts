import type { Knex } from 'knex';
import type {
  delivery_project_github_team} from './delivery_project_github_team';
import {
  delivery_project_github_teams_name,
} from './delivery_project_github_team';
import { type UUID } from 'node:crypto';
import { assertUUID } from '../service/util';

const columns = [
  'id',
  'delivery_project_id',
  'github_team_id',
  'team_type',
  'team_name',
] as const satisfies ReadonlyArray<keyof delivery_project_github_team>;

export type GithubTeamRef = {
  id: number;
  name: string;
};

export type IGithubTeamStore = {
  [P in keyof GithubTeamStore]: GithubTeamStore[P];
};

export class GithubTeamStore {
  readonly #connection: Knex;
  constructor(connection: Knex) {
    this.#connection = connection;
  }

  #table(context?: <T extends {}>(name: string) => Knex.QueryBuilder<T>) {
    const query: Exclude<typeof context, undefined> =
      context ?? this.#connection;
    return query<delivery_project_github_team>(
      delivery_project_github_teams_name,
    );
  }

  public async get(projectId: string) {
    const result = await this.#table()
      .where('delivery_project_id', projectId)
      .select(...columns);

    return toTeamRefs(result);
  }

  public async set(projectId: string, teams: Record<string, GithubTeamRef>) {
    assertUUID(projectId);
    await this.#connection.transaction(async t => {
      await this.#deleteInternal(this.#table(t), projectId);
      const rows = toRows(projectId, teams);
      if (rows.length > 0) await this.#table(t).insert(rows);
    });
  }

  public async delete(projectId: string) {
    await this.#deleteInternal(this.#table(), projectId);
  }

  #deleteInternal(
    builder: Knex.QueryBuilder<delivery_project_github_team>,
    projectId: string,
  ) {
    return builder.where('delivery_project_id', projectId).delete();
  }
}

function toTeamRefs(
  rows: delivery_project_github_team[],
): Record<string, GithubTeamRef> {
  return Object.fromEntries(
    rows.map(r => [
      r.team_type,
      {
        id: r.github_team_id,
        name: r.team_name,
      },
    ]),
  );
}

function toRows(
  projectId: UUID,
  teams: Record<string, GithubTeamRef>,
): Omit<delivery_project_github_team, 'id'>[] {
  return Object.entries(teams).map(([type, { name, id }]) => ({
    delivery_project_id: projectId,
    github_team_id: id,
    team_name: name,
    team_type: type,
  }));
}
