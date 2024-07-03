-- CreateEnum
CREATE TYPE "State" AS ENUM ('PUBLIC', 'PROTECTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "TYPE" AS ENUM ('GROUP', 'DM');

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "username42" TEXT NOT NULL,
    "secret" TEXT,
    "image" TEXT NOT NULL DEFAULT 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png',
    "twoFactor" BOOLEAN NOT NULL DEFAULT false,
    "firstTime" BOOLEAN NOT NULL DEFAULT true,
    "bio" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "wins" INTEGER,
    "lost" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "winRate" DOUBLE PRECISION,
    "score" INTEGER DEFAULT 0,
    "games" INTEGER DEFAULT 0,
    "gamehistory" INTEGER[] DEFAULT ARRAY[0]::INTEGER[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Friends" (
    "friends_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "friend_id" INTEGER NOT NULL,
    "State" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friends_pkey" PRIMARY KEY ("friends_id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL,
    "player1" INTEGER NOT NULL,
    "player2" INTEGER NOT NULL,
    "score1" INTEGER NOT NULL,
    "score2" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "chat_id" SERIAL NOT NULL,
    "chatName" TEXT NOT NULL,
    "chatBio" TEXT,
    "chatImage" TEXT NOT NULL DEFAULT 'uploads/default_Room.webp',
    "chatType" "TYPE" NOT NULL,
    "GroupState" "State" NOT NULL DEFAULT 'PUBLIC',
    "Password" TEXT,
    "chatOwner" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("chat_id")
);

-- CreateTable
CREATE TABLE "Dms" (
    "dm_id" SERIAL NOT NULL,
    "user1_id" INTEGER NOT NULL,
    "user2_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dms_pkey" PRIMARY KEY ("user1_id","user2_id")
);

-- CreateTable
CREATE TABLE "chatMembers" (
    "chatMember_id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatMembers_pkey" PRIMARY KEY ("chat_id","user_id")
);

-- CreateTable
CREATE TABLE "Banned" (
    "banned_id" SERIAL NOT NULL,
    "Banned_user" TEXT NOT NULL,
    "BannedBy_user" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banned_pkey" PRIMARY KEY ("banned_id")
);

-- CreateTable
CREATE TABLE "Muted" (
    "Muted_id" SERIAL NOT NULL,
    "Muted_user" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Muted_pkey" PRIMARY KEY ("Muted_user","chat_id")
);

-- CreateTable
CREATE TABLE "chatAdmins" (
    "chatAdmin_id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatAdmins_pkey" PRIMARY KEY ("chat_id","user_id")
);

-- CreateTable
CREATE TABLE "message" (
    "message_id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "receiver_id" INTEGER,
    "sender_login" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Dm_id" INTEGER,

    CONSTRAINT "message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "Blocked" (
    "blocked_id" SERIAL NOT NULL,
    "Blocker_Username" TEXT NOT NULL,
    "Blocked_Username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blocked_pkey" PRIMARY KEY ("blocked_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_id_key" ON "User"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_username42_key" ON "User"("username42");

-- CreateIndex
CREATE UNIQUE INDEX "Friends_friends_id_key" ON "Friends"("friends_id");

-- CreateIndex
CREATE UNIQUE INDEX "Game_id_key" ON "Game"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_chat_id_key" ON "Chat"("chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_chatName_key" ON "Chat"("chatName");

-- CreateIndex
CREATE UNIQUE INDEX "Dms_dm_id_key" ON "Dms"("dm_id");

-- CreateIndex
CREATE UNIQUE INDEX "chatMembers_chatMember_id_key" ON "chatMembers"("chatMember_id");

-- CreateIndex
CREATE UNIQUE INDEX "Banned_banned_id_key" ON "Banned"("banned_id");

-- CreateIndex
CREATE UNIQUE INDEX "Muted_Muted_id_key" ON "Muted"("Muted_id");

-- CreateIndex
CREATE UNIQUE INDEX "chatAdmins_chatAdmin_id_key" ON "chatAdmins"("chatAdmin_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_message_id_key" ON "message"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "Blocked_blocked_id_key" ON "Blocked"("blocked_id");

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_player1_fkey" FOREIGN KEY ("player1") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_player2_fkey" FOREIGN KEY ("player2") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_chatOwner_fkey" FOREIGN KEY ("chatOwner") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dms" ADD CONSTRAINT "Dms_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dms" ADD CONSTRAINT "Dms_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatMembers" ADD CONSTRAINT "chatMembers_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "Chat"("chat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatMembers" ADD CONSTRAINT "chatMembers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banned" ADD CONSTRAINT "Banned_Banned_user_fkey" FOREIGN KEY ("Banned_user") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banned" ADD CONSTRAINT "Banned_BannedBy_user_fkey" FOREIGN KEY ("BannedBy_user") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banned" ADD CONSTRAINT "Banned_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "Chat"("chat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Muted" ADD CONSTRAINT "Muted_Muted_user_fkey" FOREIGN KEY ("Muted_user") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Muted" ADD CONSTRAINT "Muted_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "Chat"("chat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatAdmins" ADD CONSTRAINT "chatAdmins_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "Chat"("chat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatAdmins" ADD CONSTRAINT "chatAdmins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "Chat"("chat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_sender_login_fkey" FOREIGN KEY ("sender_login") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_Dm_id_fkey" FOREIGN KEY ("Dm_id") REFERENCES "Dms"("dm_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocked" ADD CONSTRAINT "Blocked_Blocker_Username_fkey" FOREIGN KEY ("Blocker_Username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocked" ADD CONSTRAINT "Blocked_Blocked_Username_fkey" FOREIGN KEY ("Blocked_Username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
