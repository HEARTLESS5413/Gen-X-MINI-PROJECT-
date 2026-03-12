import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Crown, Sword, Bird, Hand, Type, ArrowLeft, Users, Link2, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users as usersStore, follows as followsStore } from '../lib/store';

const GAMES = [
    {
        id: 'ludo',
        name: 'Ludo',
        icon: '🎲',
        color: '#ff6b6b',
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        description: 'Classic board game',
        players: '2-4 Players',
        tags: ['Board', 'Strategy']
    },
    {
        id: 'chess',
        name: 'Chess',
        icon: '♟️',
        color: '#a29bfe',
        gradient: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
        description: 'Battle of minds',
        players: '2 Players',
        tags: ['Strategy', 'Classic']
    },
    {
        id: 'flappy',
        name: 'Flappy Bird',
        icon: '🐦',
        color: '#55efc4',
        gradient: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)',
        description: 'Fly high, score higher',
        players: '2 Players',
        tags: ['Arcade', 'Score']
    },
    {
        id: 'rps',
        name: 'Rock Paper Scissors',
        icon: '✊',
        color: '#fd79a8',
        gradient: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
        description: '3-second showdown',
        players: '2 Players',
        tags: ['Quick', 'Fun']
    },
    {
        id: 'word',
        name: 'Guess the Word',
        icon: '🔤',
        color: '#fdcb6e',
        gradient: 'linear-gradient(135deg, #fdcb6e 0%, #f39c12 100%)',
        description: 'Word wizards unite',
        players: '2 Players',
        tags: ['Trivia', 'Speed']
    },
];

export default function Games() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [selectedGame, setSelectedGame] = useState(null);
    const [playerMode, setPlayerMode] = useState(null);
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        if (!currentUser) return;
        async function loadFriends() {
            const following = await followsStore.getFollowing(currentUser.id);
            const users = await Promise.all(following.map(f => usersStore.getById(f.target_id)));
            setFriends(users.filter(Boolean));
        }
        loadFriends();
    }, [currentUser]);

    const handlePlay = (game) => {
        setSelectedGame(game);
        setPlayerMode(null);
    };

    const handleStartGame = (mode) => {
        setPlayerMode(mode);
        navigate(`/games/${selectedGame.id}?mode=${mode}`);
    };

    const handleInvite = (friendId) => {
        // In a real app, this would send a socket event
        alert(`Game invite sent! 🎮`);
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/games/${selectedGame?.id}?invite=${currentUser?.id}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('Invite link copied! 📋');
        });
    };

    if (selectedGame) {
        return (
            <div className="games-page">
                <div className="games-header">
                    <button className="btn-ghost" onClick={() => setSelectedGame(null)}>
                        <ArrowLeft size={22} />
                    </button>
                    <h2>{selectedGame.icon} {selectedGame.name}</h2>
                </div>

                <div className="game-setup">
                    <div className="game-setup-card" style={{ background: selectedGame.gradient }}>
                        <div className="game-setup-icon">{selectedGame.icon}</div>
                        <h3>{selectedGame.name}</h3>
                        <p>{selectedGame.description}</p>
                    </div>

                    <div className="game-mode-select">
                        <h3>Choose Mode</h3>
                        <div className="game-modes">
                            <button className="game-mode-btn" onClick={() => handleStartGame('2p')}>
                                <Users size={24} />
                                <span>2 Players</span>
                            </button>
                            {selectedGame.id === 'ludo' && (
                                <button className="game-mode-btn" onClick={() => handleStartGame('4p')}>
                                    <Users size={24} />
                                    <span>4 Players</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="game-invite-section">
                        <h3>Invite Friends</h3>
                        <button className="btn btn-primary game-invite-link-btn" onClick={copyInviteLink}>
                            <Link2 size={18} /> Copy Invite Link
                        </button>
                        <div className="game-friends-list">
                            {friends.map(friend => (
                                <div key={friend.id} className="game-friend-item">
                                    <img className="avatar avatar-md" src={friend.avatar} alt="" />
                                    <div className="game-friend-info">
                                        <span className="game-friend-name">{friend.username}</span>
                                        <span className="game-friend-status">Online</span>
                                    </div>
                                    <button className="btn btn-primary btn-sm" onClick={() => handleInvite(friend.id)}>
                                        <Share2 size={14} /> Invite
                                    </button>
                                </div>
                            ))}
                            {friends.length === 0 && (
                                <p className="game-no-friends">Follow people to invite them to games!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="games-page">
            <div className="games-header">
                <Gamepad2 size={28} />
                <h2>Games</h2>
            </div>
            <p className="games-subtitle">Challenge your friends to epic battles! 🎮</p>

            <div className="games-grid">
                {GAMES.map((game, i) => (
                    <div
                        key={game.id}
                        className="game-card"
                        style={{ '--game-color': game.color, animationDelay: `${i * 0.08}s` }}
                        onClick={() => handlePlay(game)}
                    >
                        <div className="game-card-bg" style={{ background: game.gradient }} />
                        <div className="game-card-content">
                            <div className="game-card-icon">{game.icon}</div>
                            <h3>{game.name}</h3>
                            <p>{game.description}</p>
                            <div className="game-card-tags">
                                {game.tags.map(tag => (
                                    <span key={tag} className="game-tag">{tag}</span>
                                ))}
                            </div>
                            <div className="game-card-players">
                                <Users size={14} /> {game.players}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
