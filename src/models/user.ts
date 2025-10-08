import {movieModel} from "./movie";

export interface UserModel {
    userId: number;
    name: string;
    email: string;
    lastname: string;
    age: number;
    password: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;    
}

export interface calificationsModel{
    userId: number;
    movieId: number;
    calification: number;
    movie?: movieModel;
}