
/**
 * Represents a user within the application.
 *
 * This interface defines the basic structure of a user record,
 * including personal information and optional password recovery fields.
 *
 * @interface UserModel
 * @property {string} name - The user's first name.
 * @property {string} email - The user's email address (used for login).
 * @property {string} surname - The user's last name.
 * @property {number} age - The user's age.
 * @property {string} password - The user's hashed password.
 * @property {string} [resetPasswordToken] - Optional token used for password reset verification.
 * @property {Date} [resetPasswordExpires] - Optional expiration date of the reset password token.
 *
 * @example
 * const user: UserModel = {
 *   name: "John",
 *   email: "john@example.com",
 *   surname: "Doe",
 *   age: 28,
 *   password: "hashed_password_123"
 * };
 */
export interface UserModel {
    name: string;
    email: string;
    age: number;
    password: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;    
}

/**
 * Represents a user's rating (calification) for a specific movie.
 *
 * This interface links a user to a movie through a numerical rating
 * and can optionally include detailed movie information.
 *
 * @interface calificationsModel
 * @property {number} userId - The unique identifier of the user giving the rating.
 * @property {number} movieId - The unique identifier of the movie being rated.
 * @property {number} calification - The numeric rating (e.g., 1–5).
 * @property {movieModel} [movie] - Optional movie details associated with the rating.
 *
 * @example
 * const rating: calificationsModel = {
 *   userId: 1,
 *   movieId: 101,
 *   calification: 5,
 *   movie: {
 *     movieId: 101,
 *     title: "Inception",
 *     description: "A thief who steals corporate secrets through dream-sharing.",
 *     genre: "Sci-Fi"
 *   }
 * };
 */
export interface calificationsModel {
  userId: number;
  movieId: number;
  calification: number;
}
