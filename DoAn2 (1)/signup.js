document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  form?.addEventListener('submit', function(e) {
    e.preventDefault();

    // Xóa dấu sao đỏ trên đầu (nếu có)
    const stars = document.querySelectorAll('.required-star, .star-red');
    stars.forEach(star => star.remove());

    // Lấy dữ liệu từ các ô nhập
    const fullname = form.querySelector('#fullname').value.trim();
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const repassword = form.querySelector('#repassword').value;
    const agree = form.querySelector('#agree').checked;

    if (!fullname || !email || !password || !repassword || !agree) {
      alert('Vui lòng điền đầy đủ thông tin và đồng ý điều khoản!');
      return;
    }
    if (password !== repassword) {
      alert('Mật khẩu nhập lại không khớp!');
      return;
    }

    // Lưu tất cả thông tin vào localStorage
    localStorage.setItem('ticketgoSignupUser', fullname);
    localStorage.setItem('ticketgoSignupEmail', email);
    localStorage.setItem('ticketgoSignupPassword', password);
    localStorage.setItem('ticketgoSignupAgree', agree);

    alert('Đăng ký thành công! Vui lòng đăng nhập.');
    window.location.href = 'login.html';
  });
});