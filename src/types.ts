export type DutyRole = 'Scheidsrechter' | 'W-tafel' | 'Toezichthouder' | 'Reanimatie';

export interface DutyAssignment {
  id: string;
  date: string;          // ISO format YYYY-MM-DD
  time: string;          // Format HH:mm
  homeTeam: string;
  awayTeam: string;
  pool: string;          // e.g. "Caribabad in Gorinchem" or "De Koekoek in Vaassen"
  roles: DutyRole[];     // All roles assigned to this person for this match
  person: string;        // Normalized person name
  rawText?: string;
}

export interface RoosterData {
  lastUpdated: string;
  season: string;
  persons: string[];     // Alphabetical list of unique person names
  duties: DutyAssignment[];
}
