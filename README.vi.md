# Máy In Thẻ Yu-Gi-Oh

Một ứng dụng web để tạo và in thẻ Yu-Gi-Oh! tùy chỉnh. Ứng dụng cho phép người dùng tìm kiếm thẻ từ API YGOPRODeck, xây dựng bộ bài, và xuất ra để in.

Đọc bằng [English](README.md) | [Tiếng Việt](README.vi.md)

## Tính năng

- 🔍 Tìm kiếm thẻ từ cơ sở dữ liệu YGOPRODeck với phân trang (50 thẻ/trang)
- 🎴 Xem chi tiết thẻ với hình ảnh chất lượng cao
- � Kiểm tra trạng thái cấm của thẻ (TCG/OCG)
- ➕ Tạo và quản lý thẻ tùy chỉnh
- �🃏 Xây dựng bộ bài với các phần Main Deck, Extra Deck, Side Deck
- 📤 Xuất và in thẻ với cài đặt tùy chỉnh
- 🎨 Giao diện đẹp với Tailwind CSS và shadcn-ui
- 📱 Responsive design cho mobile và desktop
- 🔐 Xác thực người dùng với Supabase
- 💾 Lưu trữ bộ bài trong cơ sở dữ liệu
- ⚡ Tối ưu hiệu suất với cache 24 giờ và debounce 300ms
- 🔄 Grid thẻ ảo hóa cho hiệu suất cao

## Công nghệ sử dụng

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn-ui
- **Backend**: Supabase (Database, Authentication, Storage)
- **API**: YGOPRODeck API
- **Build Tool**: Vite
- **Package Manager**: npm/bun
- **Deployment**: GitHub Pages

## Cài đặt và chạy

### Yêu cầu hệ thống

- Node.js 20+
- npm hoặc bun

### Cài đặt

1. Clone repository:

```bash
git clone <YOUR_GIT_URL>
cd yu-gi-oh-card-printer
```

2. Cài đặt dependencies:

```bash
npm install
# hoặc
bun install
```

3. Tạo file `.env.local` và cấu hình biến môi trường:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
```

4. Chạy ứng dụng:

```bash
npm run dev
# hoặc
bun run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## Cách sử dụng

1. Đăng ký hoặc đăng nhập vào tài khoản của bạn.
2. Tìm kiếm thẻ bằng bảng tìm kiếm (hỗ trợ phân trang với 50 thẻ/trang).
3. Thêm thẻ vào bộ bài bằng cách nhấp vào chúng.
4. Sử dụng trình xây dựng bộ bài để sắp xếp thẻ.
5. Xuất bộ bài để in hoặc chia sẻ.

## Tối ưu hiệu suất

Ứng dụng được tối ưu để mang lại trải nghiệm người dùng mượt mà:

- **Cache thông minh**: Dữ liệu API được cache trong 24 giờ để giảm thời gian tải
- **Debounce tối ưu**: Thời gian chờ tìm kiếm giảm xuống 300ms cho phản hồi nhanh hơn
- **Grid ảo hóa**: Chỉ render thẻ hiển thị trên màn hình để hiệu suất cao với danh sách lớn
- **Phân trang**: Chia kết quả tìm kiếm thành các trang 50 thẻ để dễ điều hướng
- **Lazy loading**: Hình ảnh thẻ được tải khi cần thiết để tiết kiệm băng thông

## Build và Deploy

### Build cho production

```bash
npm run build
```

### Preview build

```bash
npm run preview
```

### Deploy tự động

Ứng dụng được deploy tự động lên GitHub Pages khi push lên branch main/master thông qua GitHub Actions.

## Cấu trúc dự án

```
src/
├── components/          # Các component UI
│   ├── cards/          # Component liên quan đến thẻ
│   ├── deck/           # Component xây dựng bộ bài
│   ├── export/         # Component xuất và in
│   ├── layout/         # Layout components
│   └── ui/             # UI components từ shadcn-ui
├── hooks/              # Custom React hooks
├── integrations/       # Tích hợp bên ngoài (Supabase)
├── lib/                # Utilities và services
├── pages/              # Các trang của ứng dụng
└── types/              # TypeScript type definitions
```

## API và Services

- **YGOPRODeck API**: Cung cấp dữ liệu thẻ Yu-Gi-Oh
- **Supabase**: Database, Authentication, và Storage
- **Custom Card Service**: Quản lý thẻ tùy chỉnh
- **Deck Service**: Quản lý bộ bài

## Đóng góp

1. Fork dự án
2. Tạo branch cho feature mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## Giấy phép

Dự án này sử dụng giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## Liên hệ

Nếu bạn có câu hỏi hoặc góp ý, hãy tạo issue trên GitHub.
