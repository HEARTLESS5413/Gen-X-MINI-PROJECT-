import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, Image, Send, ArrowLeft, Camera, Gamepad2, Eye, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messages as msgStore, users as usersStore, follows as followsStore, subscribeToMessages } from '../lib/store';
import { initiateCall } from '../lib/callSignaling';
import { createGameSession } from '../lib/gameEngine';
import sounds from '../lib/sounds';
import VideoCall from '../components/VideoCall';
import AudioCall from '../components/AudioCall';
import WatchTogether from '../components/WatchTogether';
import GameLobby from '../components/GameLobby';

export default function Messages() {
    const { user: currentUser } = useAuth();
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [chatMsgs, setChatMsgs] = useState([]);
    const [allChatUsers, setAllChatUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [showAudioCall, setShowAudioCall] = useState(false);
    const [activeCallId, setActiveCallId] = useState(null);
    const [showWatchTogether, setShowWatchTogether] = useState(false);
    const [showGameMenu, setShowGameMenu] = useState(false);
    const [activeGameSessionId, setActiveGameSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Load conversations
    useEffect(() => {
        if (!currentUser) return;
        async function loadConversations() {
            const [conversations, followingData] = await Promise.all([
                msgStore.getConversations(currentUser.id),
                followsStore.getFollowing(currentUser.id),
            ]);

            const userIds = [...new Set([
                ...conversations.map(c => c.userId),
                ...followingData.map(f => f.target_id)
            ])];

            const usersData = await Promise.all(userIds.map(id => usersStore.getById(id)));
            const chatUsers = userIds.map(id => {
                const conv = conversations.find(c => c.userId === id);
                const u = usersData.find(u => u && u.id === id);
                if (!u) return null;
                return { userId: id, user: u, lastMessage: conv?.lastMessage || 'Start chatting...', time: conv?.time || '' };
            }).filter(Boolean);

            setAllChatUsers(chatUsers);
            setLoading(false);
        }
        loadConversations();
    }, [currentUser]);

    // Subscribe to real-time messages
    useEffect(() => {
        if (!currentUser) return;
        const subscription = subscribeToMessages(currentUser.id, (newMsg) => {
            // If this message is from the currently selected chat, add it
            if (selectedChat && newMsg.from_id === selectedChat) {
                setChatMsgs(prev => [...prev, newMsg]);
                sounds.notification();
            }
            // Refresh conversation list
            loadConversationList();
        });
        return () => subscription?.unsubscribe?.();
    }, [currentUser, selectedChat]);

    const loadConversationList = async () => {
        if (!currentUser) return;
        const conversations = await msgStore.getConversations(currentUser.id);
        const userIds = [...new Set(conversations.map(c => c.userId))];
        const usersData = await Promise.all(userIds.map(id => usersStore.getById(id)));
        setAllChatUsers(prev => {
            const existing = prev.map(c => c.userId);
            const updated = userIds.map(id => {
                const conv = conversations.find(c => c.userId === id);
                const u = usersData.find(u => u && u.id === id);
                if (!u) return null;
                return { userId: id, user: u, lastMessage: conv?.lastMessage || '', time: conv?.time || '' };
            }).filter(Boolean);
            // Merge with existing (keep users from follows that don't have messages yet)
            const newIds = updated.map(u => u.userId);
            const kept = prev.filter(c => !newIds.includes(c.userId));
            return [...updated, ...kept];
        });
    };

    // Load chat messages when selecting a chat
    useEffect(() => {
        if (!selectedChat || !currentUser) return;
        async function loadChat() {
            const [msgs, user] = await Promise.all([
                msgStore.getMessages(currentUser.id, selectedChat),
                usersStore.getById(selectedChat),
            ]);
            setChatMsgs(msgs);
            setSelectedUser(user);
            await msgStore.markConversationRead(currentUser.id, selectedChat);
        }
        loadChat();
    }, [selectedChat, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMsgs]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || !currentUser || !selectedChat) return;
        const msg = await msgStore.send(currentUser.id, selectedChat, message);
        if (msg) setChatMsgs(prev => [...prev, msg]);
        setMessage('');
        sounds.send();
    };

    const handleSendPhoto = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (file && currentUser && selectedChat) {
                const url = URL.createObjectURL(file);
                const msg = await msgStore.send(currentUser.id, selectedChat, '', 'image', url);
                if (msg) setChatMsgs(prev => [...prev, msg]);
            }
        };
        input.click();
    };

    const handleSendOneTime = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (file && currentUser && selectedChat) {
                const url = URL.createObjectURL(file);
                const msg = await msgStore.send(currentUser.id, selectedChat, '📷 One-time photo', 'one-time', url);
                if (msg) setChatMsgs(prev => [...prev, msg]);
            }
        };
        input.click();
    };

    const handleGameInvite = async (gameId) => {
        if (currentUser && selectedChat) {
            const gameNames = { rps: '✊ Rock Paper Scissors', tictactoe: '⭕ Tic Tac Toe' };
            // Create a real game session in Supabase
            const session = await createGameSession(currentUser.id, gameId, selectedChat);
            if (session) {
                // Embed session ID in message so receiver can join
                const msg = await msgStore.send(currentUser.id, selectedChat, `🎮 Let's play ${gameNames[gameId]}! [${session.id}]`, 'game-invite');
                if (msg) setChatMsgs(prev => [...prev, msg]);
                setActiveGameSessionId(session.id);
            }
            setShowGameMenu(false);
        }
    };

    const formatTime = (time) => {
        if (!time) return '';
        const date = new Date(time);
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading messages...</div>;

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
                                    <div className="chat-item-last">{conv.lastMessage} · {formatTime(conv.time)}</div>
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
                            <button className="btn-ghost chat-action-btn" onClick={async () => {
                                const call = await initiateCall(currentUser.id, selectedChat, 'audio');
                                if (call) {
                                    setActiveCallId(call.id);
                                    setShowAudioCall(true);
                                    const inviteMsg = await msgStore.send(currentUser.id, selectedChat, `📞 Audio Call`, 'call-invite');
                                    if (inviteMsg) setChatMsgs(prev => [...prev, inviteMsg]);
                                }
                            }} title="Audio Call">
                                <Phone size={20} />
                            </button>
                            <button className="btn-ghost chat-action-btn" onClick={async () => {
                                const call = await initiateCall(currentUser.id, selectedChat, 'video');
                                if (call) {
                                    setActiveCallId(call.id);
                                    setShowVideoCall(true);
                                    const inviteMsg = await msgStore.send(currentUser.id, selectedChat, `📹 Video Call`, 'call-invite');
                                    if (inviteMsg) setChatMsgs(prev => [...prev, inviteMsg]);
                                }
                            }} title="Video Call">
                                <Video size={20} />
                            </button>
                            <button className="btn-ghost chat-action-btn" onClick={() => setShowGameMenu(!showGameMenu)} title="Games">
                                <Gamepad2 size={20} />
                            </button>
                            <button className="btn-ghost chat-action-btn" onClick={() => setShowWatchTogether(true)} title="Watch Together">
                                <Eye size={20} />
                            </button>
                        </div>

                        {showGameMenu && (
                            <>
                                <div className="game-menu-backdrop" onClick={() => setShowGameMenu(false)} />
                                <div className="chat-game-menu">
                                    <div className="chat-game-menu-header">🎮 Invite to play</div>
                                    {[
                                        { id: 'rps', name: '✊ Rock Paper Scissors' },
                                        { id: 'tictactoe', name: '⭕ Tic Tac Toe' },
                                    ].map(game => (
                                        <button key={game.id} className="chat-game-option" onClick={() => handleGameInvite(game.id)}>{game.name}</button>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="chat-messages">
                            {chatMsgs.map(msg => (
                                <div key={msg.id} className={`chat-msg ${(msg.from_id || msg.from) === currentUser?.id ? 'sent' : 'received'} ${msg.type === 'one-time' ? 'one-time' : ''} ${msg.type === 'game-invite' || msg.type === 'call-invite' ? 'game-invite-msg' : ''}`}>
                                    {msg.type === 'call-invite' ? (
                                        <div className="chat-call-invite">
                                            <span className="call-invite-text">{msg.text}</span>
                                            {(msg.from_id || msg.from) !== currentUser?.id && (
                                                <button className="join-now-btn" onClick={async () => {
                                                    const call = await import('../lib/callSignaling').then(m => m.getActiveCall(currentUser.id));
                                                    if (call) {
                                                        setActiveCallId(call.id);
                                                        if (call.call_type === 'video') setShowVideoCall(true);
                                                        else setShowAudioCall(true);
                                                    }
                                                }}>Join Now</button>
                                            )}
                                        </div>
                                    ) : msg.type === 'image' || msg.type === 'one-time' ? (
                                        (msg.image_url || msg.imageUrl) ? (
                                            <div>
                                                <img src={msg.image_url || msg.imageUrl} alt="" />
                                                {msg.type === 'one-time' && <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>🔥 View once</div>}
                                            </div>
                                        ) : <span>{msg.text}</span>
                                    ) : msg.type === 'game-invite' ? (
                                        <div className="chat-call-invite">
                                            <span className="call-invite-text">{msg.text.replace(/\[.*\]$/, '').trim()}</span>
                                            {(msg.from_id || msg.from) !== currentUser?.id && (() => {
                                                const match = msg.text.match(/\[([^\]]+)\]$/);
                                                const sessionId = match ? match[1] : null;
                                                return sessionId ? (
                                                    <button className="join-now-btn" onClick={async () => {
                                                        const { joinGameSession } = await import('../lib/gameEngine');
                                                        await joinGameSession(sessionId, currentUser.id);
                                                        setActiveGameSessionId(sessionId);
                                                    }}>🎮 Join Now</button>
                                                ) : null;
                                            })()}
                                            {(msg.from_id || msg.from) === currentUser?.id && (() => {
                                                const match = msg.text.match(/\[([^\]]+)\]$/);
                                                const sessionId = match ? match[1] : null;
                                                return sessionId ? (
                                                    <button className="join-now-btn" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} onClick={() => {
                                                        setActiveGameSessionId(sessionId);
                                                    }}>Open Lobby</button>
                                                ) : null;
                                            })()}
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

            {showVideoCall && selectedUser && <VideoCall user={selectedUser} callId={activeCallId} onClose={() => { setShowVideoCall(false); setActiveCallId(null); }} />}
            {showAudioCall && selectedUser && <AudioCall user={selectedUser} callId={activeCallId} onClose={() => { setShowAudioCall(false); setActiveCallId(null); }} />}
            {showWatchTogether && selectedUser && <WatchTogether user={selectedUser} onClose={() => setShowWatchTogether(false)} />}
            {activeGameSessionId && <GameLobby sessionId={activeGameSessionId} onClose={() => setActiveGameSessionId(null)} />}
        </>
    );
}
