import { Knex } from 'knex';

export type Row = {
  id: string;
  delivery_project_id: string;
  github_team_id: number;
  team_type: string;
  team_name: string;
};

const columns = [
  'id',
  'delivery_project_id',
  'github_team_id',
  'team_type',
  'team_name',
] as const satisfies ReadonlyArray<keyof Row>;

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
    context ??= this.#connection;
    return context<Row>('delivery_project_github_teams');
  }

  public async get(projectId: string) {
    const result = await this.#table()
      .where('delivery_project_id', projectId)
      .select(...columns);

    return toTeamRefs(result);
  }

  public async set(projectId: string, teams: Record<string, GithubTeamRef>) {
    await this.#connection.transaction(async t => {
      await this.#deleteInternal(this.#table(t), projectId);
      const rows = toRows(projectId, teams);
      if (rows.length > 0) await this.#table(t).insert(rows);
    });
  }

  public async delete(projectId: string) {
    await this.#deleteInternal(this.#table(), projectId);
  }

  #deleteInternal(builder: Knex.QueryBuilder<Row>, projectId: string) {
    return builder.where('delivery_project_id', projectId).delete();
  }
}

function toTeamRefs(rows: Row[]): Record<string, GithubTeamRef> {
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
  projectId: string,
  teams: Record<string, GithubTeamRef>,
): Omit<Row, 'id'>[] {
  return Object.entries(teams).map(([type, { name, id }]) => ({
    delivery_project_id: projectId,
    github_team_id: id,
    team_name: name,
    team_type: type,
  }));
}
