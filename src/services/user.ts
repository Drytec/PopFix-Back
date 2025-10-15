import { supabase } from "../config/database";
import bcrypt from "bcryptjs";

/**
 * Retrieves all users from the "users" table in Supabase.
 * 
 * @async
 * @function getUsers
 * @returns {Promise<Object[]>} A promise that resolves to an array of user objects.
 * @throws {Error} If a Supabase error occurs during the query.
 */
export async function getUsers() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Retrieves a user by their email address.
 * 
 * @async
 * @function getUserByEmail
 * @param {string} email - The email of the user to retrieve.
 * @returns {Promise<Object>} A promise that resolves to the user object.
 * @throws {Error} If the user is not found or a Supabase error occurs.
 */
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Creates a new user and inserts it into the "users" table.
 * The password is automatically hashed using bcrypt before being stored.
 * 
 * @async
 * @function createUser
 * @param {string} email - The user's email address.
 * @param {string} name - The user's first name.
 * @param {string} surname - The user's last name.
 * @param {number} age - The user's age.
 * @param {string} password - The user's plaintext password.
 * @returns {Promise<Object>} A promise that resolves to the newly created user object.
 * @throws {Error} If a Supabase error occurs during the insert operation.
 */
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

/**
 * Retrieves a user by their unique ID.
 * 
 * @async
 * @function getUserById
 * @param {string} id - The unique identifier of the user.
 * @returns {Promise<Object>} A promise that resolves to the user object.
 * @throws {Error} If the user is not found or a Supabase error occurs.
 */
export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Updates an existing user's information in the "users" table.
 * 
 * @async
 * @function updateUser
 * @param {string} id - The ID of the user to update.
 * @param {Record<string, any>} updates - An object containing the fields to update.
 * @returns {Promise<Object>} A promise that resolves to the updated user object.
 * @throws {Error} If a Supabase error occurs during the update.
 */
export async function updateUser(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw new Error(error.message);
  return data[0];
}

/**
 * Deletes a user from the "users" table by their ID.
 * 
 * @async
 * @function deleteUser
 * @param {string} id - The ID of the user to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 * @throws {Error} If a Supabase error occurs during the deletion.
 */
export async function deleteUser(id: string) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
