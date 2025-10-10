# Boson Token Faucet

A simple Next.js application that allows users to claim Boson tokens on the Aptos blockchain. Each address can only claim tokens once.

## Features

- Simple web interface with address input and claim button
- Database tracking to prevent duplicate claims
- Integration with Aptos blockchain using @aptos-labs/ts-sdk
- Automatic transaction handling and confirmation

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/boson_faucet"

   # Aptos Configuration
   APTOS_PRIVATE_KEY="your_private_key_here"
   APTOS_NETWORK="testnet"
   APTOS_NODE_URL="https://fullnode.testnet.aptoslabs.com"

   # Boson Token Configuration
   BOSON_TOKEN_ADDRESS="0x1::aptos_coin::AptosCoin"
   BOSON_CLAIM_AMOUNT="50000000000"
   ```

3. **Set up the database:**
   ```bash
   npx prisma db push
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## Configuration

- **APTOS_PRIVATE_KEY**: The private key of the account that will send tokens
- **APTOS_NETWORK**: The Aptos network to use (testnet/mainnet)
- **BOSON_TOKEN_ADDRESS**: The address of the Boson token contract
- **BOSON_CLAIM_AMOUNT**: Amount of tokens to send (in smallest unit, e.g., 50000000000 = 500 tokens with 8 decimals)

## Usage

1. Open the application in your browser
2. Enter your Aptos wallet address
3. Click "Claim 500 BOSON Tokens"
4. Wait for the transaction to be confirmed
5. Check your wallet for the received tokens

## Security Notes

- Make sure to use a dedicated account for the faucet with limited funds
- The private key should be kept secure and not committed to version control
- Consider implementing rate limiting for production use
