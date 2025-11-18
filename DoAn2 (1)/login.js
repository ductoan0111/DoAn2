document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  form?.addEventListener('submit', function(e) {
    e.preventDefault();
    // Lấy dữ liệu đăng ký từ localStorage
    const signupEmail = localStorage.getItem('ticketgoSignupEmail') || '';
    const signupPassword = localStorage.getItem('ticketgoSignupPassword') || '';
    const signupName = localStorage.getItem('ticketgoSignupUser') || '';

    // Lấy dữ liệu nhập vào
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;

    // Kiểm tra email và mật khẩu
    if (signupEmail && signupPassword && email === signupEmail && password === signupPassword) {
      localStorage.setItem('ticketgoUser', signupName || email);
      alert('Đăng nhập thành công!');
      window.location.href = 'home.html'; // hoặc index.html
    } else {
      alert('Email hoặc mật khẩu không đúng hoặc chưa đăng ký!');
    }
  });
});