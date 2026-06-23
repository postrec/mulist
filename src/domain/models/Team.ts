export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  teamId: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  role: TeamRole;
  joinedAt: string;
}
