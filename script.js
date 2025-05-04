// DOM Elements
const blockchainDiv = document.getElementById("blockchain");
const creditBtn = document.getElementById("creditBtn");
const addTxBtn = document.getElementById("addTxBtn");
const statusDiv = document.getElementById("status");
const balanceListUl = document.getElementById("balance-list");
const miningSpinner = document.getElementById("mining-spinner");

// Input fields
const creditReceiverInput = document.getElementById("credit-receiver");
const creditAmountInput = document.getElementById("credit-amount");
const senderInput = document.getElementById("data-sender");
const receiverInput = document.getElementById("data-receiver");
const amountInput = document.getElementById("data-amount");
const minerInput = document.getElementById("miner-name");
const difficultyInput = document.getElementById("difficulty-input"); 
const difficultyValueDisplay = document.getElementById("difficulty-value-display"); // Span to show slider value

// Configuration 
const COINBASE_SENDER = "System"; // Identifier for system generated funds
const MINING_REWARD = 5; // Reward credited to the miner for each block

// Global State 
let balances = {}; // Stores user balances
let isMining = false; // Flag to prevent concurrent mining operations
let currentDifficulty = 2; // Initial mining difficulty (leading zeros)
let currentDifficultyPrefix = "00"; // String prefix for hash validation

// Utility Functions
//Reads the difficulty slider, updates global state, refreshes the display span, and updates the status message.

function updateDifficulty() {
  // Parse the Value from range input.
  const newDifficulty = parseInt(difficultyInput.value);

  currentDifficulty = newDifficulty;
  currentDifficultyPrefix = "0".repeat(currentDifficulty);

  // show the current value
  difficultyValueDisplay.textContent = currentDifficulty;

  console.log(`Difficulty updated to ${currentDifficulty}`);
  // Update the status message only if not currently mining
  if (!isMining) {
    setStatus(
      `Mining difficulty: Hash must start with '${currentDifficultyPrefix}'`,
      "info"
    );
  }
}

// Blockchain Core Logic 
// Represents a single block in the blockchain.

class Block {
  constructor(index, timestamp, data, previousHash = "", dataType, miner = "") {
    this.index = index; // Position in the chain
    this.timestamp = timestamp; // Time of creation
    this.data = data; // Transaction details or other data
    this.previousHash = previousHash; // Hash of the preceding block
    this.hash = ""; // This block's calculated hash
    this.nonce = 0; // Value adjusted during mining for Proof-of-Work
    this.dataType = dataType; // Type: 'genesis', 'transaction', 'coinbase'
    this.miner = miner; // Name of the miner who found this block
  }

  /**
   * Calculates the SHA-256 hash for the block's content.
   * @returns {Promise<string>} The calculated hash as a hex string.
   */
  async calculateHash() {
    const input =
      this.index +
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.data) +
      this.nonce +
      this.miner;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Mines the block by finding a nonce that results in a hash meeting the specified difficulty.
   * Uses async iteration with pauses to avoid freezing the UI.
   * @param {number} difficulty - The required number of leading zeros in the hash.
   */
  async mineBlock(difficulty) {
    const prefix = "0".repeat(difficulty);
    this.nonce = 0;
    this.hash = await this.calculateHash();
    let iterations = 0;

    // Loop until a valid hash is found or mining is cancelled
    while (this.hash.substring(0, difficulty) !== prefix) {
      if (!isMining) throw new Error("Mining cancelled"); // Allow cancellation
      this.nonce++;
      this.hash = await this.calculateHash();
      iterations++;

      // Provide status updates and yield to the event loop periodically
      if (iterations % 5000 === 0) {
        setStatus(
          `Mining Block #${this.index}... (Nonce: ${this.nonce}) Difficulty: ${difficulty}`,
          "info",
          true // Keep spinner active
        );
        // Pause briefly to allow UI updates and prevent freezing
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    console.log(
      `Block mined: ${this.hash} (Nonce: ${this.nonce}, Difficulty: ${difficulty})`
    );
  }
}

// Represents the blockchain, managing the chain of blocks.

class Blockchain {
  constructor() {
    this.chain = []; // Array to hold the blocks
  }

  // Creates and mines the initial Genesis block.
   
  async createGenesisBlock() {
    isMining = true;
    console.log("Creating Genesis Block...");
    const genesisBlock = new Block(
      0,
      Date.now(),
      "Genesis Block", // Arbitrary data for the first block
      "0", // No previous hash
      "genesis",
      "Osamah" // Default miner for genesis
    );
    setStatus(
      `Mining Genesis Block... Difficulty: ${currentDifficulty}`,
      "info",
      true
    );
    await genesisBlock.mineBlock(currentDifficulty); // Mine with current difficulty
    this.chain.push(genesisBlock);
    console.log("Genesis Block created:", genesisBlock);
    setStatus(
      `Genesis Block #0 mined! Difficulty: '${currentDifficultyPrefix}'`,
      "success"
    );
    isMining = false;
  }

  /**
   * Gets the most recent block in the chain.
   * @returns {Block} The latest block.
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Adds a new block to the chain after mining it.
   * Handles mining status updates and potential errors.
   * @param {Block} newBlock - The block to be added.
   * @returns {Promise<boolean>} - True if the block was successfully added, false otherwise.
   */
  async addBlockToChain(newBlock) {
    if (isMining) {
      setStatus("Another operation is already in progress.", "error");
      return false;
    }
    isMining = true;
    addTxBtn.disabled = true; // Disable buttons during mining
    creditBtn.disabled = true;
    setStatus(
      `Mining Block #${newBlock.index}... (Nonce: 0) Difficulty: ${currentDifficulty}`,
      "info",
      true // Show spinner
    );

    try {
      newBlock.previousHash = this.getLatestBlock().hash; // Link to the previous block
      await newBlock.mineBlock(currentDifficulty); // Mine with current difficulty
      this.chain.push(newBlock);

      // Grant mining reward after successful mining
      if (newBlock.miner && newBlock.miner !== "") {
        processBlockMiningReward(newBlock.miner);
      }

      setStatus(
        `Block #${newBlock.index} (${newBlock.dataType}) successfully mined and added! Difficulty: '${currentDifficultyPrefix}'`,
        "success"
      );
      return true; // Indicate success
    } catch (error) {
      console.error("Error adding block:", error);
      setStatus(
        error.message === "Mining cancelled"
          ? "Mining cancelled."
          : "Error mining block. See console.",
        "error"
      );
      return false; // Indicate failure
    } finally {
      isMining = false; // Reset mining flag
      addTxBtn.disabled = false; // Reenable buttons
      creditBtn.disabled = false;
      updateDifficulty(); // Refresh status message with current difficulty info
    }
  }
}

// Mining Reward Function 

function processBlockMiningReward(miner) {
  if (!miner) return; // No reward if miner name is empty
  balances[miner] = (balances[miner] || 0) + MINING_REWARD;
  console.log(`Mining reward of ${MINING_REWARD} credited to ${miner}`);
  renderBalancesUI(); // Update the displayed balances
}

// --- Balance & UI Update Functions ---

function updateBalances(block) {
  if (!block || !block.data) return;
  const data = block.data;

  if (block.dataType === "coinbase") {
    const receiver = data.receiver;
    const amount = data.amount;
    balances[receiver] = (balances[receiver] || 0) + amount;
  } else if (block.dataType === "transaction") {
    const sender = data.sender;
    const receiver = data.receiver;
    const amount = data.amount;
    // This check if funds are verified before mining.
    if ((balances[sender] || 0) >= amount) {
      balances[sender] -= amount;
      balances[receiver] = (balances[receiver] || 0) + amount;
    } else {
      // Log critical error if insufficient funds detected after mining
      console.error(
        `CRITICAL ERROR: Insufficient funds for ${sender} detected AFTER mining block ${block.index}. Balance update skipped.`
      );
      setStatus(
        `Error: Insufficient funds for ${sender} in mined block ${block.index}. Balances not updated.`,
        "error"
      );
    }
  }
  renderBalancesUI(); // Update the displayed balances
}

// Renders the current account balances in the UI list.

function renderBalancesUI() {
  balanceListUl.innerHTML = ""; // Clear previous list
  const userNames = Object.keys(balances);
  if (userNames.length === 0) {
    balanceListUl.innerHTML =
      "<li>No balances yet. Credit some funds!</li>";
    return;
  }
  // Sort names alphabetically 
  userNames.sort().forEach((user) => {
    const li = document.createElement("li");
    li.innerHTML = `${user}: <span>${balances[user]}</span>`;
    balanceListUl.appendChild(li);
  });
}

function setStatus(message, type = "info", showSpinner = false) {
  statusDiv.textContent = message;
  statusDiv.className = ""; // Clear existing style classes
  statusDiv.classList.add(type); // Add the specified style class
  miningSpinner.style.display = showSpinner ? "inline-block" : "none";
}

// Blockchain Rendering & Validation 

function renderBlockchainUI(blockchainInstance) {
  blockchainDiv.innerHTML = ""; // Clear previous rendering
  let previousBlockIsValid = true; // Track validity for connector styling

  blockchainInstance.chain.forEach((block, index) => {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.id = `block-${index}`;
    blockElement.classList.add(`block-type-${block.dataType}`); // Style based on type

    // Add class if the previous block was invalid (for connector styling)
    if (!previousBlockIsValid) {
      blockElement.classList.add("prev-invalid");
    }

    let dataDisplay = ""; // Formatted data for display
    let dataEditorValue = ""; // Raw data for the textarea
    let blockIconClass = "fa-cube"; // Default icon (genesis)

    // Format data display based on block type
    if (block.dataType === "coinbase") {
      blockIconClass = "fa-sack-dollar";
      dataDisplay = Object.entries(block.data)
        .map(
          ([key, value]) =>
            `<div class="data-item"><label>${
              key.charAt(0).toUpperCase() + key.slice(1)
            }:</label> ${value}</div>`
        )
        .join("");
      dataEditorValue = JSON.stringify(block.data, null, 2);
    } else if (block.dataType === "transaction") {
      blockIconClass = "fa-right-left";
      dataDisplay = Object.entries(block.data)
        .map(
          ([key, value]) =>
            `<div class="data-item"><label>${
              key.charAt(0).toUpperCase() + key.slice(1)
            }:</label> ${value}</div>`
        )
        .join("");
      dataEditorValue = JSON.stringify(block.data, null, 2);
    } else {
      // Genesis block
      dataDisplay = `<div class="data-item">${block.data}</div>`;
      dataEditorValue = block.data;
    }

    // Construct the block's HTML content
    blockElement.innerHTML = `
      <div class="block-header">
        <i class="fas ${blockIconClass} block-icon"></i>
        Block #${block.index} (${block.dataType.toUpperCase()})
        <i class="fas fa-check-circle validity-icon"></i> <!-- Initially shown -->
        <i class="fas fa-times-circle validity-icon"></i> <!-- Initially hidden -->
      </div>
      <p><label>Timestamp:</label> ${new Date(
        block.timestamp
      ).toLocaleString()}</p>
      <div class="data-display">${dataDisplay}</div>
      <p><label>Miner:</label> <span class="miner">${block.miner || "N/A"}</span></p>
      <p><label>Nonce:</label> <span class="nonce">${block.nonce}</span></p>
      <p><label>Prev. Hash:</label> <span class="prev-hash">${
        block.previousHash
      }</span></p>
      <p><label>Hash:</label> <span class="hash">${block.hash}</span></p>
      ${
        // Add data editor only for non-genesis blocks
        block.dataType !== "genesis"
          ? `<div><label>Edit Data (invalidates chain):</label></div>
             <textarea class="block-data-editor" rows="3" data-index="${index}">${dataEditorValue}</textarea>`
          : ""
      }
    `;

    // Add event listener for data tampering simulation
    if (block.dataType !== "genesis") {
      const textarea = blockElement.querySelector(".block-data-editor");
      textarea.addEventListener("input", handleDataChange);
    }

    blockchainDiv.appendChild(blockElement);
  });

  // Validate the entire chain visually after rendering all blocks
  validateAndHighlight(blockchainInstance);

  // Scroll to the end of the blockchain container
  const container = document.getElementById("blockchain-container");
  container.scrollLeft = container.scrollWidth;
}


async function handleDataChange(event) {
  const index = parseInt(event.target.getAttribute("data-index"));
  const block = myBlockchain.chain[index];
  if (!block || block.dataType === "genesis") return; // Ignore genesis

  const newDataRaw = event.target.value;

  // Attempt to store as JSON, fallback to raw string if invalid format
  try {
    block.data = JSON.parse(newDataRaw);
  } catch (e) {
    block.data = newDataRaw;
  }

  console.log(
    `Data potentially tampered in block ${index}. Re-calculating hash and re-validating visual chain integrity...`
  );

  // Recalculate hash with new data and orignal nonce - this simulates tampering
  // and likely breaks PoW / hash link without remining.
  block.hash = await block.calculateHash();

  // Revalidate the entire chain visually after the change
  const isChainVisuallyValid = await validateAndHighlight(myBlockchain);

  // Update status message based on visual validation result
  if (isChainVisuallyValid) {
    // Edit resulted in a visually valid chain
    setStatus(
      `Block #${index} data edited. Chain visually appears valid (difficulty '${currentDifficultyPrefix}'). Balances NOT recalculated.`,
      "success"
    );
  } else {
    // Edit resulted in a visually invalid chain
    setStatus(
      `Data in Block #${index} modified. Chain integrity compromised (difficulty '${currentDifficultyPrefix}')! Balances NOT recalculated.`,
      "error"
    );
  }
}

//Validates the blockchain visually, checking hash links, integrity, and difficulty.

async function validateAndHighlight(blockchainInstance) {
  let overallValidity = true;
  let previousBlockActualHash = "0"; // Expected hash for genesis block's predecessor

  for (let i = 0; i < blockchainInstance.chain.length; i++) {
    const block = blockchainInstance.chain[i];
    const blockElement = document.getElementById(`block-${i}`);
    if (!blockElement) continue;

    let isBlockValid = true;
    // Recalculate hash based on current data/nonce to check integrity
    const recalculatedHash = await block.calculateHash();

    // Validation Checks 
    // 1. Previous hash link
    if (block.previousHash !== previousBlockActualHash) isBlockValid = false;
    // 2. Current hash integrity 
    if (block.hash !== recalculatedHash) isBlockValid = false;
    // 3. Proof-of-work difficulty
    if (block.hash.substring(0, currentDifficulty) !== currentDifficultyPrefix) {
      isBlockValid = false;
    }

    // Apply Visual Styles
    // Style block based on its own validity 
    blockElement.classList.toggle("invalid", !isBlockValid);
    // Style connector based on the validity of the preceding part of the chain
    blockElement.classList.toggle("prev-invalid", !overallValidity);

    // Update overall chain validity for subsequent blocks
    if (!isBlockValid) overallValidity = false;
    // The current block's hash is the next block's expected previousHash
    previousBlockActualHash = block.hash;
  }
  console.log(
    `Visual validation complete. Overall chain validity (Difficulty ${currentDifficulty}):`,
    overallValidity
  );
  return overallValidity; // Return final validity status
}

// Event Listeners 

// Update difficulty state 
difficultyInput.addEventListener("input", updateDifficulty);

// Handle "Credit Funds" button click
creditBtn.addEventListener("click", async () => {
  if (isMining) return; // Prevent action if already mining
  const receiver = creditReceiverInput.value.trim();
  const amount = parseFloat(creditAmountInput.value);
  const miner = minerInput.value.trim() || "System"; // Use input value or fallback

  if (!receiver || !amount || amount <= 0) {
    setStatus("Please enter a valid receiver and positive amount.", "error");
    return;
  }
  const transactionData = { sender: COINBASE_SENDER, receiver, amount };
  const newBlock = new Block(
    myBlockchain.chain.length,
    Date.now(),
    transactionData,
    "", // previousHash is set during addBlockToChain
    "coinbase",
    miner
  );
  const success = await myBlockchain.addBlockToChain(newBlock);
  if (success) {
    updateBalances(newBlock); // Update balances only if block added successfully
    renderBlockchainUI(myBlockchain); // Rerender the chain
    // Clear input fields
    creditReceiverInput.value = "";
    creditAmountInput.value = "";
  }
});

// Handle "Send Transaction" button click
addTxBtn.addEventListener("click", async () => {
  if (isMining) return; // Prevent action if already mining
  const sender = senderInput.value.trim();
  const receiver = receiverInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const miner = minerInput.value.trim() || "System"; // Use input value or fallback

  // Input Validation
  if (!sender || !receiver || !amount || amount <= 0) {
    setStatus(
      "Please enter valid sender, receiver, and positive amount.",
      "error"
    );
    return;
  }
  if (sender === receiver) {
    setStatus("Sender and receiver cannot be the same.", "error");
    return;
  }
  // --- Balance Check ---
  const senderBalance = balances[sender] || 0;
  if (senderBalance < amount) {
    setStatus(
      `Tx Failed: Sender '${sender}' insufficient funds (Bal: ${senderBalance}).`,
      "error"
    );
    return;
  }

  // Create and Add Block 
  const transactionData = { sender, receiver, amount };
  const newBlock = new Block(
    myBlockchain.chain.length,
    Date.now(),
    transactionData,
    "", // previousHash is set during addBlockToChain
    "transaction",
    miner
  );
  const success = await myBlockchain.addBlockToChain(newBlock);
  if (success) {
    updateBalances(newBlock); // Update balances only if block added successfully
    renderBlockchainUI(myBlockchain); // Rerender the chain
    // Clear input fields
    senderInput.value = "";
    receiverInput.value = "";
    amountInput.value = "";
  }
});

// Initialize 
const myBlockchain = new Blockchain(); // Create the blockchain instance

/**
 * Initializes the application: sets initial difficulty, creates genesis block,
 * processes its reward, and renders the initial UI state.
 */
async function initialize() {
  updateDifficulty(); // Set initial difficulty state and update display span
  await myBlockchain.createGenesisBlock();
  // Process mining reward for the Genesis block miner
  if (myBlockchain.chain[0] && myBlockchain.chain[0].miner) {
    processBlockMiningReward(myBlockchain.chain[0].miner);
  }
  renderBlockchainUI(myBlockchain); // Render the initial blockchain
  renderBalancesUI(); // Render initial (empty) balances
}

// Start the application
initialize();
