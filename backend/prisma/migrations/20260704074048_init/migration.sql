-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "papers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "passages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paper_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source_info" TEXT,
    "passage_structure" TEXT,
    "passage_summary" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "passages_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "papers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "paragraphs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "passage_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "paragraphs_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "passages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sentences" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paragraph_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "tokens" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sentences_paragraph_id_fkey" FOREIGN KEY ("paragraph_id") REFERENCES "paragraphs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "questions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "passage_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "question_type" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "stem" TEXT NOT NULL,
    "stem_tokens" TEXT NOT NULL,
    "answer_blocks" TEXT NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "main_idea_analysis" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "questions_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "passages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "options" (
    "question_id" INTEGER NOT NULL,
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "distractor_type" TEXT NOT NULL,
    "distractor_explanation" TEXT,
    "evidence_sentence" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,

    PRIMARY KEY ("question_id", "id"),
    CONSTRAINT "options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "practice_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "passage_id" TEXT NOT NULL,
    "question_id" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'practice',
    "step" INTEGER NOT NULL DEFAULT 1,
    "selected_keywords" TEXT,
    "selected_block_ids" TEXT,
    "distractor_judgments" TEXT,
    "final_answer" TEXT,
    "is_correct" BOOLEAN,
    "keyword_accuracy" REAL,
    "location_accuracy" REAL,
    "time_spent_ms" INTEGER,
    "highlights" TEXT,
    "underlines" TEXT,
    "notes" TEXT,
    "main_method" TEXT,
    "structure_prediction" TEXT,
    "main_summary" TEXT,
    "keyword_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "block_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "distractor_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "answer_submitted" BOOLEAN NOT NULL DEFAULT false,
    "main_summary_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "structure_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "started_at" DATETIME,
    "submitted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "practice_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "practice_records_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "practice_records_user_id_passage_id_question_id_key" ON "practice_records"("user_id", "passage_id", "question_id");
