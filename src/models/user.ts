import {movieModel} from "./movie";

export interface UserModel {
    name: string;
    email: string;
    surname: string;
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