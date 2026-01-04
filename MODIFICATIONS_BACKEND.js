// 🔧 MODIFICATIONS À APPORTER AU BACKEND

// ========================================
// 1. Modifier POST /insert-message
// ========================================

// ❌ AVANT (lignes ~112-126)
if (req.method === "POST" && path === "/insert-message") {
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  const supabaseUser = getSupabaseUserClient(req);
  if (!supabaseUser) return res.status(401).json({ error: "Token manquant" });

  const body = await readJsonBody(req);
  const { message } = body || {};
  if (!message) return res.status(400).json({ error: "message requis" });

  const { error } = await supabaseUser.from("messages").insert({
    message,
    user_id: user.id,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ message: "Message inséré avec succès." });
}

// ✅ APRÈS - Remplacez par ceci :
if (req.method === "POST" && path === "/insert-message") {
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  const supabaseUser = getSupabaseUserClient(req);
  if (!supabaseUser) return res.status(401).json({ error: "Token manquant" });

  const body = await readJsonBody(req);
  const { message, image_url } = body || {};  // ⬅️ Ajout de image_url
  
  // Message ou image requis (au moins l'un des deux)
  if (!message && !image_url) {
    return res.status(400).json({ error: "message ou image_url requis" });
  }

  const { error } = await supabaseUser.from("messages").insert({
    message: message || "",  // Peut être vide si seulement une image
    user_id: user.id,
    image_url,  // ⬅️ Ajout de image_url
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ message: "Message inséré avec succès." });
}


// ========================================
// 2. Modifier GET /mathys
// ========================================

// ❌ AVANT (lignes ~85-103)
if (req.method === "GET" && path === "/mathys") {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select(`
      *,
      profiles!user_id(username)
    `)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  
  const messagesWithUsername = data.map(msg => ({
    ...msg,
    username: msg.profiles?.username || 'Utilisateur'
  }));
  
  return res.json(messagesWithUsername);
}

// ✅ APRÈS - Remplacez par ceci :
if (req.method === "GET" && path === "/mathys") {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select(`
      *,
      profiles!user_id(username, color)
    `)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  
  const messagesWithUsername = data.map(msg => ({
    ...msg,
    username: msg.profiles?.username || 'Utilisateur',
    image_url: msg.image_url  // ⬅️ S'assurer que image_url est bien retourné
  }));
  
  return res.json(messagesWithUsername);
}


// ========================================
// 3. BONUS : Modifier GET /messages/:id/commentaires (optionnel pour les images dans les commentaires)
// ========================================

// Si vous voulez aussi supporter les images dans les commentaires plus tard,
// faites la même chose pour la route des commentaires


// ========================================
// 4. NOUVELLE ROUTE : GET /users
// Ajoutez cette nouvelle route pour les mentions @username
// ========================================

if (req.method === "GET" && path === "/users") {
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, name, color, avatar_url")
    .order("name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  
  return res.json(data || []);
}
