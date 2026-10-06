CREATE TABLE `book_reviews` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `bookId` int NOT NULL,
  `rating` int NOT NULL,
  `review` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `book_reviews_id` PRIMARY KEY(`id`),
  CONSTRAINT `book_reviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `book_reviews_bookId_books_id_fk` FOREIGN KEY (`bookId`) REFERENCES `books`(`id`) ON DELETE CASCADE,
  CONSTRAINT `book_reviews_rating_check` CHECK (`rating` BETWEEN 1 AND 5),
  CONSTRAINT `book_reviews_user_book_uq` UNIQUE(`userId`,`bookId`)
);
--> statement-breakpoint
CREATE INDEX `book_reviews_book_idx` ON `book_reviews` (`bookId`,`createdAt`);
