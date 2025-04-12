from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt
import jwt
import datetime 

app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'anyPassword123',
    'database': 'weather_app'
}

SECRET_KEY = "anySecretKey123"

def get_db_connection():
    """Crea y retorna una conexión a la base de datos MySQL."""
    return mysql.connector.connect(
        host=db_config['host'],
        user=db_config['user'],
        password=db_config['password'],
        database=db_config['database']
    )

@app.route('/')
def home():
    return 'Flask API working correctly'

# ------------------------------------------------------------------
# Ruta para registrar un usuario
# ------------------------------------------------------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400

    # Encriptamos la contraseña antes de guardarla
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    # Convertir a string (UTF-8) para guardarlo en la BD
    hashed_password_str = hashed_password.decode('utf-8')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insertamos al nuevo usuario en la base de datos
        query = "INSERT INTO users (email, password) VALUES (%s, %s)"
        cursor.execute(query, (email, hashed_password_str))
        conn.commit()
        
        user_id = cursor.lastrowid
        return jsonify({'message': 'User successfully registered', 'user_id': user_id}), 201
    except mysql.connector.Error as err:
        return jsonify({'message': f'Error when registering the user: {err}'}), 500
    finally:
        cursor.close()
        conn.close()

# ------------------------------------------------------------------
# Ruta para login
# ------------------------------------------------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Obtenemos el usuario por email
        query = "SELECT * FROM users WHERE email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Verificar la contraseña
        stored_password = user['password'].encode('utf-8')  # La que está en la DB
        if bcrypt.hashpw(password.encode('utf-8'), stored_password) == stored_password:

            payload = {
                "user_id": user['idusers'],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            # Contraseña correcta
            return jsonify({
                'message': 'Successful login',
                'token': token,
                'user': {
                    'id': user['idusers'],
                    'email': user['email'],
                    'favorite_places': user['favorite_places'] or ""
                }
            }), 200
        else:
            return jsonify({'message': 'Incorrect password'}), 401
    except mysql.connector.Error as err:
        return jsonify({'message': f'Login failed: {err}'}), 500
    finally:
        cursor.close()
        conn.close()


# Ruta para obtener lugares favoritos de un usuario
@app.route('/user/<int:user_id>/favorites', methods=['GET'])
def get_favorites(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT favorite_places FROM users WHERE idusers = %s"
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()

        if not result:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'user_id': user_id,
            'favorite_places': result['favorite_places'] or ""
        }), 200
    except mysql.connector.Error as err:
        return jsonify({'message': f'Error when getting favorites: {err}'}), 500
    finally:
        cursor.close()
        conn.close()

# Ruta para actualizar/agregar lugares favoritos
@app.route('/user/<int:user_id>/favorites', methods=['POST'])
def update_favorites(user_id):
    data = request.json
    new_place = data.get('new_place')

    if not new_place:
        return jsonify({'message': 'No new city provided'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Se consulta usando idusers
        query_select = "SELECT favorite_places FROM users WHERE idusers = %s"
        cursor.execute(query_select, (user_id,))
        result = cursor.fetchone()

        if not result:
            return jsonify({'message': 'User not found'}), 404
        
        current_places = result['favorite_places'] or ""
        
        if current_places == "":
            updated_places = new_place
        else:
            updated_places = current_places + "," + new_place

        query_update = "UPDATE users SET favorite_places = %s WHERE idusers = %s"
        cursor.execute(query_update, (updated_places, user_id))
        conn.commit()

        return jsonify({
            'message': 'Favorite cities successfully updated',
            'favorite_places': updated_places
        }), 200
    except mysql.connector.Error as err:
        return jsonify({'message': f'Error when updating favorites {err}'}), 500
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    app.run(debug=True)
