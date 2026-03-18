import { type User, type UpsertUser } from "@shared/models/auth";
import { supabase } from "../../db";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(userData: UpsertUser): Promise<User>;
}

type UserRow = {
  user_id: number;
  email: string;
  password: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function userFromRow(row: UserRow): User {
  return {
    id: row.user_id,
    email: row.email,
    password: row.password,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function userToRow(userData: Partial<UpsertUser>) {
  return {
    email: userData.email,
    password: userData.password,
    first_name: userData.firstName ?? null,
    last_name: userData.lastName ?? null,
    updated_at: new Date().toISOString(),
  };
}

class AuthStorage implements IAuthStorage {
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase.from("users").select("*").eq("user_id", id).maybeSingle();
    if (error) throw error;
    return data ? userFromRow(data as UserRow) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    if (error) throw error;
    return data ? userFromRow(data as UserRow) : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .upsert(userToRow(userData), { onConflict: "email" })
      .select("*")
      .single();
    if (error) throw error;
    return userFromRow(data as UserRow);
  }
}

export const authStorage = new AuthStorage();
