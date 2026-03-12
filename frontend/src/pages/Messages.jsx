import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, Image, Send, ArrowLeft, Camera, Gamepad2, Eye, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messages as msgStore, users as usersStore, follows as followsStore } from '../lib/store';
import { initiateCall } from '../lib/callSignaling';
import sounds from '../lib/sounds';
import VideoCall from '../components/VideoCall';
import AudioCall from '../components/AudioCall';
import WatchTogether from '../components/WatchTogether';

export default function Messages() {
    const { user: currentUser } = useAuth();
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [chatMsgs, setChatMsgs] = useState([]);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [showAudioCall, setShowAudioCall] = useState(false);
    const [showWatchTogether, setShowWatchTogether] = useState(false);
    const [showGameMenu, setShowGameMenu] = useState(false);
    const messagesEndRef = useRef(null);

    const conversations = currentUser ? msgStore.getConversations(currentUser.id) : [];
    const following = currentUser ? followsStore.getFollowing(currentUser.id) : [];
    const allChatUsers = [...new Set([
        ...conversations.map(c => c.userId),
        ...following.map(f => f.targetId)
    ])].map(id => {
        const conv = conversations.find(c => c.userId === id);
        const u = usersStore.getById(id);
        return { userId: id, user: u, lastMessage: conv?.lastMessage || 'Start chatting...', time: conv?.time || '' };
    }).filter(c => c.user);

    useEffect(() => {
        if (selectedChat && currentUser) {
            setChatMsgs(msgStore.getMessages(currentUser.id, selectedChat));
            msgStore.markConversationRead(currentUser.id, selectedChat);
        }
    }, [selectedChat, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMsgs]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim() || !currentUser || !selectedChat) return;
        msgStore.send(currentUser.id, selectedChat, message);
        setChatMsgs(msgStore.getMessages(currentUser.id, selectedChat));
        setMessage('');
        sounds.send();
    };

    const handleSendPhoto = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file && currentUser && selectedChat) {
                const url = URL.createObjectURL(file);
                msgStore.send(currentUser.id, selectedChat, '', 'image', url);
                setChatMsgs(msgStore.getMessages(currentUser.id, selectedChat));
            }
        };
        input.click();
    };

    const handleSendOneTime = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file && currentUser && selectedChat) {
                const url = URL.createObjectURL(file);
                msgStore.send(currentUser.id, selectedChat, '📷 One-time photo', 'one-time', url);
                setChatMsgs(msgStore.getMessages(currentUser.id, selectedChat));
            }
        };
        input.click();
    };

    const handleGameInvite = (gameId) => {
        if (currentUser && selectedChat) {
            const gameNames = { ludo: '🎲 Ludo', chess: '♟️ Chess', flappy: '🐦 Flappy Bird', rps: '✊ Rock Paper Scissors', word: '🔤 Guess the Word' };
            const link = `${window.location.origin}/games/${gameId}?invite=${currentUser.id}`;
            msgStore.send(currentUser.id, selectedChat, `🎮 Let's play ${gameNames[gameId]}! Join here: ${link}`, 'game-invite');
            setChatMsgs(msgStore.getMessages(currentUser.id, selectedChat));
            setShowGameMenu(false);
        }
    };

    const selectedUser = selectedChat ? usersStore.getById(selectedChat) : null;

    return (
        <>
            <div className="messages-page">
                {/* Chat List */}
                <div className="chat-list" style={{ display: selectedChat && window.innerWidth < 768 ? 'none' : 'flex' }}>
                    <div className="chat-list-header">
                        <h2>{currentUser?.username}</h2>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {allChatUsers.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                <p>No messages yet</p>
                                <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Follow people to start chatting</p>
                            </div>
                        )}
                        {allChatUsers.map(conv => (
                            <div key={conv.userId}
                                className={`chat-item ${selectedChat === conv.userId ? 'active' : ''}`}
                                onClick={() => setSelectedChat(conv.userId)}>
                                <img className="avatar avatar-md" src={conv.user.avatar} alt="" />
                                <div className="chat-item-info">
                                    <div className="chat-item-name">{conv.user.username}</div>
                                    <div className="chat-item-last">{conv.lastMessage} · {conv.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Room */}
                {selectedChat && selectedUser ? (
                    <div className="chat-room">
                        <div className="chat-room-header">
                            <button className="btn-ghost" onClick={() => setSelectedChat(null)} style={{ display: window.innerWidth < 768 ? 'block' : 'none' }}>
                                <ArrowLeft size={20} />
                            </button>
                            <img className="avatar avatar-md" src={selectedUser.avatar} alt="" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600' }}>{selectedUser.username}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Active now</div>
                            </div>
                            <button className="btn-ghost chat-action-btn" onClick={() => { initiateCall(currentUser.id, selectedChat, 'audio'); setShowAudioCall(true); }} title="Audio Call">
                                <Phone size={20} />
                            </button>
                            <button className="btn-ghost chat-action-btn" onClick={() => { initiateCall(currentUser.id, selectedChat, 'video'); setShowVideoCall(true); }} title="Video Call">
                                <Video size={20} />
                            </button>
                            <button className="btn-ghost chat-action-btn" onClick={() => setShowGameMenu(!showGameMenu)} title="Games">
                                <Gamepad2 size={20} />
                            </button>
                            <button className="btn-ghost chat-action-btn" onClick={() => setShowWatchTogether(true)} title="Watch Together">
                                <Eye size={20} />
                            </button>
                        </div>

                        {/* Game invite dropdown */}
                        {showGameMenu && (
                            <>
                                <div className="game-menu-backdrop" onClick={() => setShowGameMenu(false)} />
                                <div className="chat-game-menu">
                                    <div className="chat-game-menu-header">🎮 Invite to play</div>
                                    {[
                                        { id: 'ludo', name: '🎲 Ludo' },
                                        { id: 'chess', name: '♟️ Chess' },
                                        { id: 'flappy', name: '🐦 Flappy Bird' },
                                        { id: 'rps', name: '✊ Rock Paper Scissors' },
                                        { id: 'word', name: '🔤 Guess the Word' },
                                    ].map(game => (
                                        <button key={game.id} className="chat-game-option" onClick={() => handleGameInvite(game.id)}>
                                            {game.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="chat-messages">
                            {chatMsgs.map(msg => (
                                <div key={msg.id} className={`chat-msg ${msg.from === currentUser?.id ? 'sent' : 'received'} ${msg.type === 'one-time' ? 'one-time' : ''} ${msg.type === 'game-invite' ? 'game-invite-msg' : ''}`}>
                                    {msg.type === 'image' || msg.type === 'one-time' ? (
                                        msg.imageUrl ? (
                                            <div>
                                                <img src={msg.imageUrl} alt="" onClick={() => {
                                                    if (msg.type === 'one-time' && msg.from !== currentUser?.id) {
                                                        msgStore.markViewed(msg.id);
                                                        setChatMsgs(msgStore.getMessages(currentUser.id, selectedChat));
                                                    }
                                                }} />
                                                {msg.type === 'one-time' && <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>🔥 View once</div>}
                                            </div>
                                        ) : <span>{msg.text}</span>
                                    ) : msg.type === 'game-invite' ? (
                                        <div className="game-invite-content">
                                            <Gamepad2 size={18} />
                                            <span>{msg.text}</span>
                                        </div>
                                    ) : msg.text}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input-bar" onSubmit={handleSend}>
                            <button type="button" className="btn-ghost" onClick={handleSendPhoto}><Image size={20} /></button>
                            <button type="button" className="btn-ghost" onClick={handleSendOneTime} title="Send one-time photo"><Camera size={20} /></button>
                            <input className="input-field" placeholder="Message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                            {message && <button type="submit"><Send size={20} /></button>}
                        </form>
                    </div>
                ) : (
                    <div className="chat-room" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            <Send size={48} strokeWidth={1} />
                            <h2 style={{ fontWeight: '300', margin: '16px 0 8px' }}>Your messages</h2>
                            <p style={{ fontSize: '0.9rem' }}>Send private messages to a friend</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Overlays */}
            {showVideoCall && selectedUser && (
                <VideoCall user={selectedUser} onClose={() => setShowVideoCall(false)} />
            )}
            {showAudioCall && selectedUser && (
                <AudioCall user={selectedUser} onClose={() => setShowAudioCall(false)} />
            )}
            {showWatchTogether && selectedUser && (
                <WatchTogether user={selectedUser} onClose={() => setShowWatchTogether(false)} />
            )}
        </>
    );
}
