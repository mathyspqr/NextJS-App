// ========================================
// ROUTE 1 : POST /insert-message
// Remplacez votre route actuelle (lignes ~112-126) par celle-ci
// ========================================

if (req.method === "POST" && path === "/insert-message") {
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  const supabaseUser = getSupabaseUserClient(req);
  if (!supabaseUser) return res.status(401).json({ error: "Token manquant" });

  const body = await readJsonBody(req);
  const { message, image_url } = body || {};
  
  // Message ou image requis (au moins l'un des deux)
  if (!message && !image_url) {
    return res.status(400).json({ error: "message ou image_url requis" });
  }

  const { error } = await supabaseUser.from("messages").insert({
    message: message || "",
    user_id: user.id,
    image_url,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ message: "Message inséré avec succès." });
}


// ========================================
// ROUTE 2 : GET /mathys
// Remplacez votre route actuelle (lignes ~85-103) par celle-ci
// ========================================

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
    image_url: msg.image_url
  }));
  
  return res.json(messagesWithUsername);
}


// ========================================
// ROUTE 3 : GET /users
// Nouvelle route pour récupérer la liste des utilisateurs pour les mentions
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
