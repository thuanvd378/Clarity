import { useState, useEffect } from "react";
import { connect, disconnect, isConnected, request } from "@stacks/connect";
import {
  fetchCallReadOnlyFunction,
  stringUtf8CV,
  uintCV,
  trueCV,
  falseCV,
} from "@stacks/transactions";
import "./App.css";

const network = "testnet";
const CONTRACT_ADDRESS = "ST2YN1XAQENHZE51ZWRPTV27QYCGS762AGTES6VF8"; // replace with real one
const CONTRACT_NAME = "message-board";

function App() {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [challenges, setChallenges] = useState([]);

  const [content, setContent] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [reward, setReward] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    const status = isConnected();
    setConnected(status);
    if (status) loadChallenges();
  }, []);

  const connectWallet = async () => {
    await connect({
      appDetails: {
        name: "FitStake",
        icon: window.location.origin + "/logo.png",
      },
      onFinish: () => {
        const profile = window.userSession?.loadUserData()?.profile;
        const address = profile?.stxAddress?.testnet;
        if (address) {
          setUserAddress(address);
          setConnected(true);
          loadChallenges();
        }
      },
    });
  };

  const disconnectWallet = () => {
    disconnect();
    setConnected(false);
    setUserAddress("");
    setChallenges([]);
  };

  const saveChallenge = async () => {
    if (!content.trim() || !maxParticipants || !entryFee || !reward) return;

    setLoading(true);
    try {
      await request("stx_callContract", {
        contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
        functionName: "create-challenge-full",
        functionArgs: [
          stringUtf8CV(content),
          uintCV(parseInt(maxParticipants)),
          uintCV(parseInt(entryFee)),
          uintCV(parseInt(reward)),
          isConfirmed ? trueCV() : falseCV(),
        ],
        network,
      });

      setContent("");
      setMaxParticipants("");
      setEntryFee("");
      setReward("");
      setIsConfirmed(false);
      setShowForm(false);

      setTimeout(() => {
        loadChallenges();
        setLoading(false);
      }, 2000);
    } catch (err) {
      console.error("Error saving challenge:", err);
      setLoading(false);
    }
  };

  const loadChallenges = async () => {
    try {
      const countRes = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "get-challenge-count",
        functionArgs: [],
        network,
        senderAddress: CONTRACT_ADDRESS,
      });

      const count = parseInt(countRes.value);
      const promises = [];

      for (let i = 0; i < count; i++) {
        promises.push(
          fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: "get-challenge",
            functionArgs: [uintCV(i)],
            network,
            senderAddress: CONTRACT_ADDRESS,
          })
        );
      }

      const results = await Promise.all(promises);

      const loaded = results.map((r, i) => {
        const val = r.value.data;
        return {
          id: i,
          content: val.content.value,
          participants: parseInt(val.participants.value),
          fee: parseInt(val.entry_fee.value),
          reward: parseInt(val.reward.value),
          confirmed: val.confirmed.value,
        };
      });

      setChallenges(loaded);
    } catch (err) {
      console.error("Error loading challenges:", err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏋️ FitStake</h1>
        {!connected ? (
          <button onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <button onClick={disconnectWallet}>Disconnect</button>
        )}
      </header>

      {connected && (
        <main className="App-main">
          <section className="create-section">
            {!showForm ? (
              <button onClick={() => setShowForm(true)}>+ Create Challenge</button>
            ) : (
              <div className="form-box">
                <h2>New Challenge Form</h2>
                <input
                  type="text"
                  placeholder="Challenge content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max participants"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Entry fee (in microSTX)"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Reward (in microSTX)"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                />
                <label>
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                  />
                  Confirmed?
                </label>
                <button onClick={saveChallenge} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </section>

          <section className="challenge-list">
            <h2>🏆 All Challenges</h2>
            {challenges.length === 0 ? (
              <p>No challenges created yet.</p>
            ) : (
              <ul>
                {challenges.map((c) => (
                  <li key={c.id}>
                    <strong>#{c.id + 1}</strong> — {c.content} <br />
                    Participants: {c.participants} | Fee: {c.fee} | Reward: {c.reward} |{" "}
                    Status: {c.confirmed ? "✅ Confirmed" : "❌ Not confirmed"}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
