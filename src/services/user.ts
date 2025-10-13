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
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data; // could be null if not found
}
export async function createUser(
  email: string,
  name: string,
  age: number,
  password: string,
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  // Agrega surname genérico para cumplir con NOT NULL
  const { data, error } = await supabase
    .from("users")
    .insert([{ email, name, age, password: hashedPassword, surname: 'N/A' }])
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
  const toUpdate: Record<string, any> = {};
  if (typeof updates.name === "string") toUpdate.name = updates.name;
  if (typeof updates.email === "string") toUpdate.email = updates.email;
  if (typeof updates.age === "number") toUpdate.age = updates.age;
  if (typeof updates.password === "string" && updates.password.length >= 8) {
    toUpdate.password = await bcrypt.hash(updates.password, 10);
  }

  const { data, error } = await supabase
    .from("users")
    .update(toUpdate)
    .eq("id", id)
    .select();
  if (error) throw new Error(error.message);
  return data[0];
}

export async function deleteUser(id: string) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
