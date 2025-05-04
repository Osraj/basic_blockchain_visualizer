===============================
        BLOCKCHAIN VISUALIZER
===============================

PREVIEW LINK
-------------
https://blockchain.osraj.com/

PROJECT OVERVIEW
----------------
Blockchain Visualizer is an interactive web application that demonstrates the principles of blockchain technology through visual representation. It simulates a simplified blockchain that includes:

- A mining algorithm using proof-of-work consensus with adjustable difficulty
- Transactions between user accounts
- Coinbase operations (system-generated tokens)
- Real-time validation of blockchain integrity
- Visual display of blocks, connections, and validation status

EDUCATIONAL OBJECTIVES
-----------------------
This project is designed for students, developers, or anyone curious about learning the fundamentals of blockchain technology by:

- Demonstrating core blockchain concepts
- Showing how cryptographic hashes link blocks in a chain
- Illustrating the proof-of-work mining mechanism
- Emphasizing blockchain's data integrity and tamper detection
- Modeling cryptocurrency transactions and balance tracking

TECHNICAL FEATURES
------------------
- Proof-of-Work: SHA-256 hashing with adjustable difficulty via a UI slider (controls the number of leading zeros required in the hash).
- Blockchain Integrity: Real-time validation of the entire chain.
- Transaction System: Supports balance-validated transfers between users.
- Coinbase Mechanism: System-generated rewards for mining.
- Interactive Interface: Dynamic updates and visual feedback.
- Tampering Simulation: Shows how invalid blocks are detected.

SETUP INSTRUCTIONS
------------------

Option 1: Direct Deployment
- Clone or download the project repository
- Open `index.html` in any modern web browser

Option 2: Local Server (Recommended for Web Crypto API)
- Clone or download the project
- Run a local server:

  Using Python 3.x:
    python -m http.server 8000

  Using Python 2.x:
    python -m SimpleHTTPServer 8000

  Using Node.js:
    npx http-server

- Visit http://localhost:8000 in your browser

USAGE GUIDE
-----------

1. Creating New Funds (Coinbase)
   - Go to "Credit Funds (Coinbase)"
   - Enter a receiver name (e.g., Alice)
   - Enter the amount (e.g., 100)
   - Click "Credit Funds"

   > A coinbase block will be mined and funds credited.

2. Making Transactions
   - Go to "Make Transaction"
   - Enter sender name (must have balance)
   - Enter receiver name
   - Enter transaction amount
   - Click "Send Transaction"

   > A new transaction block will be mined and added to the chain.

3. Mining Options
   - **Miner Name:** Enter the name to associate with mined blocks. This name will receive the mining reward (currently 5 units per block). Defaults to "Osamah".
   - **Difficulty:** Adjust the mining difficulty using the slider (1-5 recommended). This sets the number of leading zeros required for a valid block hash. Higher difficulty takes significantly longer to mine. The selected value is shown next to the slider.

4. Exploring the Blockchain
   - Scroll horizontally to navigate through the blocks
   - Each block includes:
     - Block type (Genesis / Transaction / Coinbase)
     - Timestamp
     - Transaction data
     - Miner name
     - Nonce (value found during mining)
     - Previous hash
     - Current hash
     - Validity status (color-coded)

5. Simulating Tampering
   - Modify any block’s data using the provided text area
   - Observe how the block and all subsequent blocks become invalid (red border, broken link) because the hash no longer matches the data/nonce or the difficulty requirement.
   - Note: Balances remain unchanged to emphasize integrity violation, not recalculation.

TECHNICAL IMPLEMENTATION DETAILS
--------------------------------

Block Structure:
- Index: Position in the chain
- Timestamp: Time of creation
- Data: Transaction or metadata
- Previous Hash: Hash of the previous block
- Hash: Current block’s hash
- Nonce: Value found to solve proof-of-work
- DataType: Genesis / Transaction / Coinbase
- Miner: Name of the miner who found the block

Blockchain Validation Logic:
- Current hash must match recalculated hash based on block contents.
- Previous hash must match actual hash of the previous block.
- Hash must meet the current difficulty requirement (leading zeros).

Mining Process:
- Start with nonce = 0.
- Repeatedly hash the block data + nonce until the hash meets the current difficulty requirement.
- Increment nonce each time until a valid hash is found.

DESIGN DECISIONS
----------------
- Vanilla Web Stack: HTML, CSS, JS for accessibility and simplicity.
- Web Crypto API: Secure SHA-256 hashing.
- Asynchronous Mining: Uses `async/await` and brief pauses (`setTimeout(resolve, 0)`) to prevent UI freezing during intensive mining.
- Responsive Design: Adapts to various screen sizes.
- Visual Indicators: Color coding and icons for validation feedback and block types.

ACKNOWLEDGEMENTS
----------------
- Assistance with generating and refining this README file was provided by the Gemini 2.5 Pro model. The model also offered helpful suggestions and support for debugging during the project's code development.