# 🔧 Modification du Backend pour les Images

## Modifications à apporter au backend (Express/Node.js)

### 1. Ajouter le champ image_url dans la route POST /insert-message

Trouvez la route qui gère l'insertion de messages et modifiez-la :

```javascript
// AVANT
app.post('/insert-message', verifyToken, async (req, res) => {
  const { message } = req.body;
  const user_id = req.user.id;

  const { data, error } = await supabase
    .from('messages')
    .insert([{ message, user_id }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// APRÈS
app.post('/insert-message', verifyToken, async (req, res) => {
  const { message, image_url } = req.body;  // ⬅️ Ajout de image_url
  const user_id = req.user.id;

  const { data, error } = await supabase
    .from('messages')
    .insert([{ 
      message, 
      user_id,
      image_url  // ⬅️ Ajout de image_url
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
```

### 2. Modifier la route GET pour inclure image_url

Assurez-vous que la route GET retourne aussi le champ `image_url` :

```javascript
// Route GET /mathys ou /messages
app.get('/mathys', async (req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(username, color)')  // ⬅️ S'assurer d'inclure tous les champs
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  
  // Formater la réponse
  const messages = data.map(msg => ({
    id: msg.id,
    message: msg.message,
    username: msg.profiles?.username,
    user_id: msg.user_id,
    created_at: msg.created_at,
    image_url: msg.image_url  // ⬅️ Inclure image_url
  }));
  
  res.json(messages);
});
```

### 3. Vérification

Après modification :
1. Redémarrez votre serveur backend
2. Testez l'upload d'une image depuis le frontend
3. Vérifiez dans la console que l'image s'affiche correctement

## 🔍 Débogage

Si ça ne fonctionne pas :
1. Vérifiez les logs du backend
2. Vérifiez que la colonne `image_url` existe dans la table `messages`
3. Vérifiez que le bucket `message-images` existe dans Supabase Storage
4. Vérifiez les politiques de sécurité du bucket

## ✅ Test complet

1. **Exécutez le SQL** : `setup_images.sql`
2. **Créez le bucket** : Suivez les instructions dans `STORAGE_SETUP.md`
3. **Modifiez le backend** : Suivez les instructions ci-dessus
4. **Redémarrez le backend**
5. **Testez dans l'application** :
   - Cliquez sur l'icône image 🖼️
   - Sélectionnez une image
   - Écrivez un message (optionnel)
   - Envoyez
   - L'image devrait s'afficher dans le message ! 🎉
