import type { SQLiteDatabase } from 'expo-sqlite';

import type { Team, TeamMember, TeamRole } from '../../domain/models';

export class TeamRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async save(team: Team): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO teams (id, name, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, owner_id=excluded.owner_id, updated_at=excluded.updated_at`,
      team.id,
      team.name,
      team.ownerId,
      team.createdAt,
      team.updatedAt,
    );
  }

  public async findAll(): Promise<readonly Team[]> {
    const rows = await this.database.getAllAsync<TeamRow>(
      'SELECT * FROM teams ORDER BY name',
    );
    return rows.map(toTeam);
  }

  public async saveMember(member: TeamMember): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO team_members (team_id, uid, email, display_name, role, joined_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(team_id, uid) DO UPDATE SET email=excluded.email, display_name=excluded.display_name, role=excluded.role`,
      member.teamId,
      member.uid,
      member.email,
      member.displayName,
      member.role,
      member.joinedAt,
    );
  }

  public async findMembers(teamId: string): Promise<readonly TeamMember[]> {
    const rows = await this.database.getAllAsync<MemberRow>(
      'SELECT * FROM team_members WHERE team_id = ? ORDER BY joined_at',
      teamId,
    );
    return rows.map(toMember);
  }

  public async remove(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM teams WHERE id = ?', id);
  }
}

interface TeamRow {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}
interface MemberRow {
  team_id: string;
  uid: string;
  email: string | null;
  display_name: string | null;
  role: TeamRole;
  joined_at: string;
}
const toTeam = (row: TeamRow): Team => ({
  id: row.id,
  name: row.name,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const toMember = (row: MemberRow): TeamMember => ({
  teamId: row.team_id,
  uid: row.uid,
  email: row.email,
  displayName: row.display_name,
  role: row.role,
  joinedAt: row.joined_at,
});
