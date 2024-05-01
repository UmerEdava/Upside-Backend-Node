export interface LOGIN_BODY {
    username: string
    password: string
};

export interface SIGNUP_BODY {
    name: string
    username: string
    email: string
    password: string
}

export interface CREATE_POST {
    postedBy: string
    text: string
    img: string
}