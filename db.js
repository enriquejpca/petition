const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:postgres:postgres@localhost:5432/signatures`
);

exports.getRegistration = (first, last, email, password) => {
    return db.query(
        `INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [first, last, email, password]
    );
};

exports.getUserByMail = (email) => {
    return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
};

exports.checkTheSignature = (user_id) => {
    return db.query(`SELECT * FROM signatures WHERE user_id = $1`, [user_id]);
};

exports.signPetition = (user_id, signature) => {
    return db.query(
        `INSERT INTO signatures (user_id, signature)
        VALUES ($1, $2)
        RETURNING id`,
        [user_id, signature]
    );
};

exports.getSignature = (signature) => {
    return db.query(`SELECT signature FROM signatures WHERE id=$1`, [
        signature,
    ]);
};

exports.getSigners = () => {
    //console.log("hello");
    return db.query(
        `SELECT * FROM users JOIN signatures ON users.id = signatures.user_id JOIN user_profiles ON users.id = user_profiles.user_id`
    );
};

exports.getMoreInfo = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [age, city, url, user_id]
    );
};

exports.getSignersByCity = (city) => {
    return db.query(
        `SELECT first, last, age, city FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE LOWER(city)=LOWER($1)`,
        [city]
    );
};

exports.getInfoRegistration = (user_id) => {
    return db.query(
        `SELECT * FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE user_id = $1`,
        [user_id]
    );
};

exports.updateUserWithoutPwChange = (userId, first, last, email) => {
    return db.query(
        `UPDATE users SET first = $2, last = $3, email = $4 WHERE id = $1`,
        [userId, first, last, email]
    );
};

exports.updateUsersTableWithPassword = (
    userId,
    first,
    last,
    email,
    password
) => {
    return db.query(
        `UPDATE users SET first = $2, last = $3, email = $4, password = $5 WHERE id = $1`,
        [userId, first, last, email, password]
    );
};

// exports.upsertForTheUserProfileTable = (userId, age, city, url) => {
//     return db.query(
//         `INSERT INTO user_profiles
//         VALUES ($1, $2, $3, $4)
//         ON CONFLICT user_id
//         DO UPDATE SET age = $1, city = $2, url=$3`,
//         [userId, age, city, url]
//     );
// };

exports.updateUserProfile = (user_id, age, city, url) => {
    return db.query(
        `INSERT INTO user_profiles (user_id, age, city, url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $2, city = $3, url = $4;`,
        [user_id, age, city, url]
    );
};

exports.deleteSignature = (user_id) => {
    return db.query(`DELETE FROM signatures WHERE user_id = $1;`, [user_id]);
};
