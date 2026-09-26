import React, { useState, useEffect } from 'react'

function GameRow({ game, onDelete, onEdit }) {
    return (
        <tr className="game-row">
        <td>{game.name}</td>
        <td>{game.genre}</td>
        <td>{game.hours}</td>
        <td>{game.rating}</td>
        <td>{game.recommendation}</td>
        <td>
            <button onClick={() => onEdit(game)}>Edit</button>
            <button onClick={() => onDelete(game._id)}>🗑</button>
        </td>
        </tr>
    )
}

function GameForm({ game, onChange, onSubmit, editing }) {
    return (
        <section id="add-game">
            <h2>{editing ? 'Edit Game' : 'Add a Game'}</h2>

            <form onSubmit={onSubmit}>
                <section className="form-row">
                    <label htmlFor="gamename">Game Name:</label>
                    <input
                        type="text"
                        id="gamename"
                        name="name"
                        placeholder="game name here"
                        value={game.name}
                        onChange={onChange}
                        required
                    />
                </section>

                <section className="form-row">
                    <label htmlFor="genre">Genre:</label>
                    <input
                        type="text"
                        id="genre"
                        name="genre"
                        placeholder="genre here"
                        value={game.genre}
                        onChange={onChange}
                        required
                    />
                </section>

                <section className="form-row">
                    <label htmlFor="hoursplayed">Hours Played:</label>
                    <input
                        type="number"
                        id="hoursplayed"
                        name="hours"
                        placeholder="hours played here"
                        value={game.hours}
                        onChange={onChange}
                        required
                    />
                </section>

                <section className="form-row">
                    <label htmlFor="rating">Rating (1-10):</label>
                    <input
                        type="number"
                        id="rating"
                        name="rating"
                        placeholder="rating here (1-10)"
                        min="1"
                        max="11"
                        value={game.rating}
                        onChange={onChange}
                        required
                    />
                </section>

                <button>
                    {editing ? 'Save Changes' : 'Add Game'}
                </button>
            </form>
        </section>
    )
}

function App() {
    const [session, setSession] = useState(null)
    const [games, setGames] = useState([])
    const [newGame, setNewGame] = useState({
        name: '',
        genre: '',
        hours: '',
        rating: ''
    })
    const [editingId, setEditingId] = useState(null)


    useEffect(() => {
    fetch('/session')
        .then(response => response.json())
        .then(data => {
        setSession(data)
        })
    }, [])

    useEffect(() => {
        if(session && session.loggedIn) {
            fetch('/data')
                .then(response => response.json())
                .then(data => {
                    setGames(data)
                })
        }
    }, [session])

    const handleGameChange = (event) => {
    const { name, value } = event.target

    setNewGame({
        ...newGame,
        [name]: value
    })
    }

    const submitGame = async (event) => {
        event.preventDefault()

        const game = {
            name: newGame.name,
            genre: newGame.genre,
            hours: Number(newGame.hours),
            rating: Number(newGame.rating)
        }

    let response
    if(editingId === null) {

        response = await fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(game)
        })

    } else {

        response = await fetch('/edit/' + editingId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(game)
        })
    }

        console.log(await response.text())

        setNewGame({
            name: '',
            genre: '',
            hours: '',
            rating: ''
        })
        setEditingId(null)

        const dataResponse = await fetch('/data')
        const data = await dataResponse.json()

        setGames(data)
    }

    const deleteGame = async (id) => {

        await fetch('/delete/' + id, {
            method: 'DELETE'
        })

        const response = await fetch('/data')
        const data = await response.json()

        setGames(data)
    }

    const editGame = (game) => {
        setEditingId(game._id)

        setNewGame({
            name: game.name,
            genre: game.genre,
            hours: game.hours,
            rating: game.rating
        })
    }

    const loginUser = async (event) => {
        event.preventDefault()

        const formData = new FormData(event.target)

        const username = formData.get('username')
        const password = formData.get('password')

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            username: username,
            password: password
            })
        })

        const result = await response.json()

        if (result.success) {
            setSession({
            loggedIn: true,
            username: username
            })
        } else {
            alert(result.message)
        }
    }

    const logoutUser = async () => {
        await fetch('/logout', {
            method: 'POST'
        })
        setSession({
            loggedIn: false
        })
        setGames([])
    }

    return (
        <section>
            <header>
                <h1>Game Tracker</h1>
                <p>Keep track of the games you've played.</p>

                {session && session.loggedIn && (
                    <p id="user-info">Logged in as: {session.username}</p>
                )}

                {session && !session.loggedIn && (
                    <p id="user-info">Not currently logged in</p>
                )}
            </header>

            <main>
                {session && !session.loggedIn && (
                <section id="login">
                    <h2>Login</h2>

                    <form id="login-form" onSubmit={loginUser}>
                        <section className="form-row">
                        <label htmlFor="username">Username:</label>
                        <input type="text" id="username" name="username" required />
                        </section>

                        <section className="form-row">
                        <label htmlFor="password">Password:</label>
                        <input type="password" id="password" name="password" required />
                        </section>

                        <button>Login</button>
                    </form>
                </section>
                )}
                
                {session && session.loggedIn && (
                    <>
                        <section id="logout">
                            <button id="logout-button" onClick={logoutUser}>Logout</button>
                        </section>

                        <GameForm
                        game={newGame}
                        onChange={handleGameChange}
                        onSubmit={submitGame}
                        editing={editingId !== null}
                        />

                        <section id="game-library">
                            <h2>Game Library</h2>

                            <table>
                                <thead>
                                <tr>
                                    <th>Game</th>
                                    <th>Genre</th>
                                    <th>Hours Played</th>
                                    <th>Rating</th>
                                    <th>Recommendation</th>
                                    <th>Action</th>
                                </tr>
                                </thead>

                                <tbody id="game-table">
                                    {games.map(game => (
                                        <GameRow
                                        key={game._id}
                                        game={game}
                                        onDelete={deleteGame}
                                        onEdit={editGame}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    </>
                )}
            </main>
        </section>
  )
}

export default App