
service postgresql start

# -- serial is a special data type that automatically increments the value whenever a new row is inserted into the table.
# create table chat (
#     chatId serial NOT NULL PRIMARY KEY,
#     chatType VARCHAR(5) NOT NULL CHECK (chatType IN ('group', 'dm')),
#     createdAt timestamp default CURRENT_TIMESTAMP, 
#     visibility VARCHAR(7) NOT NULL  CHECK (visibility IN ('public', 'private')),
#     chatPassword varchar
# );


# create Table users (
#     userId serial NOT NULL PRIMARY KEY,
#     username varchar(50) NOT NULL,
#     image varchar default 'image_path',
#     createdat timestamp default CURRENT_TIMESTAMP, 
#     bio varchar
# );

# create table messages (
#     messageId serial NOT NULL PRIMARY KEY,
#     messageText varchar NOT NULL,
#     createdAt timestamp default CURRENT_TIMESTAMP, 
#     userId integer NOT NULL,
#     chatId integer NOT NULL,
#     FOREIGN KEY (userId) REFERENCES users(userId),
#     FOREIGN KEY (chatId) REFERENCES chat(chatId)

# );

# create table chat_members (
#     chatId integer NOT NULL,
#     userId integer NOT NULL,
#     FOREIGN KEY (chatId) REFERENCES chat(chatId),
#     FOREIGN KEY (userId) REFERENCES users(userId)
#     PRIMARY KEY (chatId, userId)
# );