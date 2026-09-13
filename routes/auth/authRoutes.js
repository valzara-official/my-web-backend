// Xử lý Lưu Thêm hoặc Sửa thành viên
  const handleSaveUser = (e) => {
    e.preventDefault();
    
    // Phân định rõ ràng endpoint cho Thêm mới và Sửa thông tin
    const endpoint = isEditingUser 
      ? `${API_BASE}/auth/users/${selectedUserId}` 
      : `${API_BASE}/auth/register`; 
      
    const method = isEditingUser ? 'PUT' : 'POST';

    // Chuẩn bị dữ liệu gửi đi (nếu đang sửa mà để trống mật khẩu thì không gửi trường password để tránh ghi đè mã hóa rỗng)
    const payload = { ...userForm };
    if (isEditingUser && (!payload.password || payload.password.trim() === '')) {
      delete payload.password;
    }

    fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Thực hiện không thành công');
        }
        return data;
      })
      .then(data => {
        alert(isEditingUser ? 'Cập nhật thành viên thành công!' : 'Thêm thành viên thành công!');
        setShowModal(false);
        fetchUsers();
      })
      .catch(err => {
        console.error('Lỗi thao tác user:', err);
        alert(err.message || 'Có lỗi xảy ra khi kết nối đến máy chủ.');
      });
  };