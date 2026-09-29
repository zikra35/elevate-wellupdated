import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Shield, Trash2, Edit2, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
});

// ── Article Form Modal ───────────────────────────────────────────────────────
function ArticleFormModal({ article, onClose, onSave }: { article?: any; onClose: () => void; onSave: (data: any) => void }) {
  const [formData, setFormData] = useState(article || {
    title: "",
    author: "",
    readTimeMinutes: 5,
    category: "Nutrition",
    thumbnailUrl: "",
    content: ""
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">{article ? "Edit Article" : "New Article"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Author</label>
            <Input value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Read Time (min)</label>
              <Input type="number" value={formData.readTimeMinutes} onChange={(e) => setFormData({...formData, readTimeMinutes: parseInt(e.target.value)})} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option>Nutrition</option>
                <option>Fitness</option>
                <option>Mental Health</option>
                <option>Sleep</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Thumbnail URL</label>
            <Input value={formData.thumbnailUrl} onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Content</label>
            <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm h-24" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(formData); onClose(); }}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recipe Form Modal ────────────────────────────────────────────────────────
function RecipeFormModal({ recipe, onClose, onSave }: { recipe?: any; onClose: () => void; onSave: (data: any) => void }) {
  const [formData, setFormData] = useState(recipe || {
    name: "",
    imageUrl: "",
    prepTimeMin: 10,
    cookTimeMin: 20,
    servings: 2,
    caloriesPerServing: 300,
    ingredients: [],
    steps: [],
    dietaryTags: [],
    mealType: "Lunch"
  });

  const dietaryOptions = ["Vegan", "Vegetarian", "Pescatarian", "Keto", "Paleo", "Gluten-Free", "Dairy-Free", "Halal", "Kosher", "Low-Carb", "High-Protein", "Mediterranean"];

  const addIngredient = () => {
    setFormData({...formData, ingredients: [...formData.ingredients, ""]});
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...formData.ingredients];
    updated[index] = value;
    setFormData({...formData, ingredients: updated});
  };

  const removeIngredient = (index: number) => {
    setFormData({...formData, ingredients: formData.ingredients.filter((_: any, i: number) => i !== index)});
  };

  const addStep = () => {
    setFormData({...formData, steps: [...formData.steps, ""]});
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...formData.steps];
    updated[index] = value;
    setFormData({...formData, steps: updated});
  };

  const removeStep = (index: number) => {
    setFormData({...formData, steps: formData.steps.filter((_: any, i: number) => i !== index)});
  };

  const toggleDietaryTag = (tag: string) => {
    const updated = formData.dietaryTags.includes(tag)
      ? formData.dietaryTags.filter((t: string) => t !== tag)
      : [...formData.dietaryTags, tag];
    setFormData({...formData, dietaryTags: updated});
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">{recipe ? "Edit Recipe" : "New Recipe"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Recipe Name</label>
            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Image URL</label>
            <Input value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Prep Time (min)</label>
              <Input type="number" value={formData.prepTimeMin} onChange={(e) => setFormData({...formData, prepTimeMin: parseInt(e.target.value)})} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Cook Time (min)</label>
              <Input type="number" value={formData.cookTimeMin} onChange={(e) => setFormData({...formData, cookTimeMin: parseInt(e.target.value)})} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Servings</label>
              <Input type="number" value={formData.servings} onChange={(e) => setFormData({...formData, servings: parseInt(e.target.value)})} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Calories/Serving</label>
              <Input type="number" value={formData.caloriesPerServing} onChange={(e) => setFormData({...formData, caloriesPerServing: parseInt(e.target.value)})} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Meal Type</label>
            <select value={formData.mealType} onChange={(e) => setFormData({...formData, mealType: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>Snack</option>
              <option>Dessert</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Dietary Tags</label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleDietaryTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    formData.dietaryTags.includes(tag)
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Ingredients</label>
            <div className="space-y-2">
              {formData.ingredients.map((ing: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <Input value={ing} onChange={(e) => updateIngredient(idx, e.target.value)} placeholder="e.g., 2 cups flour" className="flex-1" />
                  <Button size="sm" variant="destructive" onClick={() => removeIngredient(idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addIngredient}><Plus className="mr-1 h-4 w-4" /> Add Ingredient</Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Steps</label>
            <div className="space-y-2">
              {formData.steps.map((step: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-xs font-medium text-muted-foreground pt-2 min-w-6">{idx + 1}.</span>
                  <textarea value={step} onChange={(e) => updateStep(idx, e.target.value)} placeholder="Step description" className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm h-16" />
                  <Button size="sm" variant="destructive" onClick={() => removeStep(idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addStep}><Plus className="mr-1 h-4 w-4" /> Add Step</Button>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(formData); onClose(); }}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Video Form Modal ─────────────────────────────────────────────────────────
function VideoFormModal({ video, onClose, onSave }: { video?: any; onClose: () => void; onSave: (data: any) => void }) {
  const [formData, setFormData] = useState(video || {
    title: "",
    thumbnailUrl: "",
    durationSeconds: 600,
    category: "Meditation",
    description: "",
    videoUrl: ""
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">{video ? "Edit Video" : "New Video"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Thumbnail URL</label>
            <Input value={formData.thumbnailUrl} onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Duration (sec)</label>
              <Input type="number" value={formData.durationSeconds} onChange={(e) => setFormData({...formData, durationSeconds: parseInt(e.target.value)})} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option>Meditation</option>
                <option>Yoga</option>
                <option>Nutrition</option>
                <option>Fitness</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm h-20" />
          </div>
          <div>
            <label className="text-sm font-medium">Video URL</label>
            <Input value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} className="mt-1" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(formData); onClose(); }}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [editingVideo, setEditingVideo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const [gamesData, articlesData, recipesData, videosData] = await Promise.all([
        apiCall("/games").catch(() => []),
        apiCall("/healthy-living/articles").catch(() => []),
        apiCall("/healthy-living/recipes").catch(() => []),
        apiCall("/healthy-living/videos").catch(() => [])
      ]);
      setGames(gamesData);
      setArticles(articlesData);
      setRecipes(recipesData);
      setVideos(videosData);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function saveArticle(data: any) {
    try {
      if (editingArticle) {
        await apiCall(`/healthy-living/articles/${editingArticle._id}`, {
          method: "PUT",
          body: JSON.stringify(data)
        });
        toast.success("Article updated");
      } else {
        await apiCall("/healthy-living/articles", {
          method: "POST",
          body: JSON.stringify(data)
        });
        toast.success("Article created");
      }
      setEditingArticle(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to save article");
    }
  }

  async function deleteArticle(id: string) {
    if (!confirm("Delete this article?")) return;
    try {
      await apiCall(`/healthy-living/articles/${id}`, { method: "DELETE" });
      toast.success("Article deleted");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  async function saveRecipe(data: any) {
    try {
      if (editingRecipe) {
        await apiCall(`/healthy-living/recipes/${editingRecipe._id}`, {
          method: "PUT",
          body: JSON.stringify(data)
        });
        toast.success("Recipe updated");
      } else {
        await apiCall("/healthy-living/recipes", {
          method: "POST",
          body: JSON.stringify(data)
        });
        toast.success("Recipe created");
      }
      setEditingRecipe(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to save recipe");
    }
  }

  async function deleteRecipe(id: string) {
    if (!confirm("Delete this recipe?")) return;
    try {
      await apiCall(`/healthy-living/recipes/${id}`, { method: "DELETE" });
      toast.success("Recipe deleted");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  async function saveVideo(data: any) {
    try {
      if (editingVideo) {
        await apiCall(`/healthy-living/videos/${editingVideo._id}`, {
          method: "PUT",
          body: JSON.stringify(data)
        });
        toast.success("Video updated");
      } else {
        await apiCall("/healthy-living/videos", {
          method: "POST",
          body: JSON.stringify(data)
        });
        toast.success("Video created");
      }
      setEditingVideo(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to save video");
    }
  }

  async function deleteVideo(id: string) {
    if (!confirm("Delete this video?")) return;
    try {
      await apiCall(`/healthy-living/videos/${id}`, { method: "DELETE" });
      toast.success("Video deleted");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage content and settings for the platform.</p>
      </div>

      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>

        {/* Games Tab */}
        <TabsContent value="games" className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold">Focus & Reaction Games</h2>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Game</Button>
          </div>
          {games.length > 0 ? (
            <div className="space-y-4">
              {games.map(g => (
                <div key={g._id} className="flex items-center justify-between p-4 rounded-2xl bg-background shadow-[var(--shadow-neumorphic-inset-sm)]">
                  <div>
                    <h3 className="font-semibold">{g.title}</h3>
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                  </div>
                  <Switch checked={g.isActive} onCheckedChange={() => {}} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No games added yet.</p>
          )}
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold">Articles</h2>
            <Button onClick={() => { setEditingArticle(null); setShowArticleForm(true); }}><Plus className="mr-2 h-4 w-4" /> New Article</Button>
          </div>
          {articles.length > 0 ? (
            <div className="space-y-3">
              {articles.map(a => (
                <div key={a._id} className="flex items-center justify-between p-4 rounded-2xl bg-background">
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-xs text-muted-foreground">{a.author} · {a.readTimeMinutes} min read · {a.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingArticle(a); setShowArticleForm(true); }}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteArticle(a._id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No articles yet.</p>
          )}
        </TabsContent>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold">Recipes</h2>
            <Button onClick={() => { setEditingRecipe(null); setShowRecipeForm(true); }}><Plus className="mr-2 h-4 w-4" /> New Recipe</Button>
          </div>
          {recipes.length > 0 ? (
            <div className="space-y-3">
              {recipes.map(r => (
                <div key={r._id} className="flex items-center justify-between p-4 rounded-2xl bg-background">
                  <div>
                    <h3 className="font-semibold">{r.name}</h3>
                    <p className="text-xs text-muted-foreground">{r.mealType} · {r.caloriesPerServing} cal · {r.servings} servings</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingRecipe(r); setShowRecipeForm(true); }}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteRecipe(r._id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No recipes yet.</p>
          )}
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold">Videos</h2>
            <Button onClick={() => { setEditingVideo(null); setShowVideoForm(true); }}><Plus className="mr-2 h-4 w-4" /> New Video</Button>
          </div>
          {videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map(v => (
                <div key={v._id} className="flex items-center justify-between p-4 rounded-2xl bg-background">
                  <div>
                    <h3 className="font-semibold">{v.title}</h3>
                    <p className="text-xs text-muted-foreground">{v.category} · {Math.floor(v.durationSeconds / 60)} min</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingVideo(v); setShowVideoForm(true); }}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteVideo(v._id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No videos yet.</p>
          )}
        </TabsContent>
      </Tabs>

      {showArticleForm && <ArticleFormModal article={editingArticle} onClose={() => { setShowArticleForm(false); setEditingArticle(null); }} onSave={saveArticle} />}
      {showRecipeForm && <RecipeFormModal recipe={editingRecipe} onClose={() => { setShowRecipeForm(false); setEditingRecipe(null); }} onSave={saveRecipe} />}
      {showVideoForm && <VideoFormModal video={editingVideo} onClose={() => { setShowVideoForm(false); setEditingVideo(null); }} onSave={saveVideo} />}
    </div>
  );
}
