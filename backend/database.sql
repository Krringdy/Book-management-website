-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 02, 2026 at 08:44 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dunavitu_books`
--
CREATE DATABASE IF NOT EXISTS `dunavitu_books` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dunavitu_books`;

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `price` int(11) NOT NULL DEFAULT 0,
  `image` varchar(500) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `category_id` varchar(10) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_new` tinyint(1) DEFAULT 0,
  `is_trending` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `is_foreign` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `description`, `price`, `image`, `stock`, `category_id`, `is_featured`, `is_new`, `is_trending`, `created_at`, `is_foreign`) VALUES
(1, 'Đắc Nhân Tâm', 'Dale Carnegie', 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử, giúp bạn chinh phục lòng người.', 129000, 'https://i.pinimg.com/736x/1c/22/df/1c22df7132ad8f1358688b23831e9eaf.jpg', 49, 'c4', 1, 0, 1, '2026-05-08 23:15:56', 1),
(2, 'Nhà Giả Kim', 'Paulo Coelho', 'Hành trình theo đuổi giấc mơ của chàng chăn cừu Santiago, một áng văn đầy triết lý.', 99000, 'https://i.pinimg.com/736x/23/58/a6/2358a6c9d445649287a22fdbafb4f020.jpg', 40, 'c1', 1, 0, 1, '2026-05-08 23:15:56', 1),
(3, 'Tuổi Trẻ Đáng Giá Bao Nhiêu', 'Rosie Nguyễn', 'Cuốn sách truyền cảm hứng cho giới trẻ về cách sống có ý nghĩa và theo đuổi đam mê.', 119000, 'https://i.pinimg.com/736x/99/f3/60/99f360b56e5901ce2423ecbd5ca2de55.jpg', 34, 'c1', 1, 1, 0, '2026-05-08 23:15:56', 0),
(4, 'Cây Cam Ngọt Của Tôi', 'José Mauro de Vasconcelos', 'Câu chuyện cảm động về tuổi thơ trong sáng và đau thương của cậu bé Zezé.', 139000, 'https://i.pinimg.com/736x/4e/36/ca/4e36caf0f0361db687467944baae45b9.jpg', 27, 'c1', 1, 1, 1, '2026-05-08 23:15:56', 1),
(5, 'Tư Duy Nhanh Và Chậm', 'Daniel Kahneman', 'Khám phá cách não bộ hoạt động và ảnh hưởng đến quyết định hàng ngày của chúng ta.', 149000, 'https://i.pinimg.com/736x/56/21/cd/5621cdc689fc14e011d7647212e54780.jpg', 24, 'c4', 0, 1, 1, '2026-05-08 23:15:56', 1),
(6, 'Sapiens: Lược Sử Loài Người', 'Yuval Noah Harari', 'Hành trình 70.000 năm của loài người từ thời tiền sử đến kỷ nguyên hiện đại.', 179000, 'https://i.pinimg.com/736x/5d/07/1f/5d071f66712200bb1c963f1838f06983.jpg', 20, 'c2', 0, 0, 1, '2026-05-08 23:15:56', 1),
(7, 'Harry Potter và Hòn Đá Phù Thủy', 'J.K. Rowling', 'Cuộc phiêu lưu kỳ diệu của cậu bé phù thủy Harry Potter tại trường Hogwarts.', 159000, 'https://i.pinimg.com/736x/67/2b/7d/672b7d75ad718a61734ebc2abf2cfeb1.jpg', 43, 'c3', 0, 0, 1, '2026-05-08 23:15:56', 1),
(8, 'Atomic Habits', 'James Clear', 'Phương pháp xây dựng thói quen tốt và loại bỏ thói quen xấu một cách khoa học.', 139000, 'https://i.pinimg.com/736x/20/d1/a6/20d1a65703a999cd0b39f87d7bb41c1d.jpg', 60, 'c4', 0, 1, 0, '2026-05-08 23:15:56', 1),
(9, 'Tâm lý học ứng dụng', 'Patrick King', 'Trí thông minh xã hội là việc hòa nhập, thu hút mọi người và khiến sự giao tiếp xã hội đem lại lợi ích cho bạn, thay vì cản trở bạn đạt được...', 200000, 'https://i.pinimg.com/736x/c1/f3/43/c1f3431d7cb45d0c59d464ec02d5a4a2.jpg', 10, 'c4', 1, 0, 1, '2026-06-02 13:07:55', 0),
(10, 'Giải mã siêu trí nhớ', 'Mai Tường Vân', 'Một cuốn sách hay giải mã giúp bạn đọc hiểu thêm sâu sắc về khả năng nhận nhức của trí tuệ giúp rèn luyện trí nhớ và mở mang thêm về khả năng con người', 320000, 'https://i.pinimg.com/736x/b9/89/2e/b9892e7dd93d753d6f912022a4b78e22.jpg', 36, 'c4', 0, 0, 1, '2026-06-02 13:31:29', 0);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
('c1', 'Văn học'),
('c2', 'Kinh tế'),
('c3', 'Thiếu nhi'),
('c4', 'Tâm lý');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `address` text NOT NULL,
  `total` int(11) NOT NULL DEFAULT 0,
  `status` enum('pending','confirmed','shipping','done','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `address`, `total`, `status`, `created_at`) VALUES
(1, 2, 'thôn 3 phú cát', 447000, 'shipping', '2026-05-08 23:20:39'),
(2, 2, 'thôn 3 phú cát', 288000, 'done', '2026-05-08 23:20:57'),
(3, 3, '234 Nguyễn Chí Thanh', 258000, 'confirmed', '2026-06-02 02:20:23'),
(4, 2, '734 Kim Giang', 139000, 'cancelled', '2026-06-02 02:39:37'),
(5, 2, '734 Kim Giang', 139000, 'pending', '2026-06-02 02:46:36');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `book_id`, `quantity`, `price`) VALUES
(1, 1, 7, 2, 159000),
(2, 1, 1, 1, 129000),
(3, 2, 4, 1, 139000),
(4, 2, 5, 1, 149000),
(5, 3, 4, 1, 139000),
(6, 3, 3, 1, 119000),
(7, 4, 4, 1, 139000),
(8, 5, 4, 1, 139000);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'Admin', 'admin@dunavitu.vn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '2026-05-08 23:15:56'),
(2, 'Đoàn Thành Duy', 'duylogitech@gmail.com', '$2a$10$4faTw1P8NjHwW0FLJYdigOmMK29Z7B6LNxgl5C5yNltAg5LDkpEp6', 'admin', '2026-05-08 23:19:58'),
(3, 'Nguyen Van A', 'nguyenvana@gmail.com', '$2a$10$INa/UsVlexS7Of0n/zlkR.OmJSJgbxnRITZLYbWKkDIFLChZDSgxS', 'user', '2026-06-02 02:19:56'),
(4, 'âsd', 'ádas', '$2a$10$PpGerQGt6TwfM7J65PbOa.iac8QJUjJRx4P1VeD0cYXZsPpxWFnxq', 'user', '2026-06-02 11:14:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `books`
--
ALTER TABLE `books`
  ADD CONSTRAINT `books_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
