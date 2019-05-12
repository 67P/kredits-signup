function createBrainWallet(e) {
  e.preventDefault();
  var password = document.getElementById('password').value;
  var salt = "kredits-" + document.getElementById('username').value;
  var passwordBuffer = new buffer.SlowBuffer(password.normalize('NFKC'));
  var saltBuffer = new buffer.SlowBuffer(salt.normalize('NFKC'));

  var N = (1 << 18), r = 8, p = 1;
  var dkLen = 32;

  var notice = document.getElementById('wallet-notice');

  scrypt(passwordBuffer, saltBuffer, N, r, p, dkLen, function(error, progress, key) {
    if (error) {
      notice.innerHTML = "Something went wrong: " + error;
      console.log("Error: " + error);
    } else if (key) {
      console.log("Found: " + key);
      var wallet = new ethers.Wallet(ethers.utils.hexlify(key));
      document.getElementById('account').value = wallet.address;
      notice.innerHTML = "Your address: " + wallet.address;
    } else {
      notice.innerHTML = "Creating your wallet: " + Math.ceil(progress*100) + "%";
    }
  });
}
document.getElementById('brain-wallet').addEventListener('submit', createBrainWallet);
