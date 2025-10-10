import { supabase } from "../config/database";
import bcrypt from "bcryptjs";

export async function getUsers() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw new Error(error.message);
  return data;
}

export async function getUserByEmail(email: string) {
    const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
    if (error) throw new Error(error.message);
    return data;
}
export async function createUser(
  email: string,
  name: string,
  surname: string,
  age: number,
  password: string,
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from("users")
    .insert([{ email, name, surname, age, password: hashedPassword }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateUser(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw new Error(error.message);
  return data[0];
}

export async function deleteUser(id: string) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
