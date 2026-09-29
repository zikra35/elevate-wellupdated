"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getArticles, getRecipes, getVideos, saveRecipeToFavourites, removeRecipeFromFavourites, getFavouriteRecipes } from "@/lib/backend-api";
import { Clock, Heart, ExternalLink, Loader2, Play, Search, ArrowDown, BookOpen, UtensilsCrossed, Video } from "lucide-react";

export const Route = createFileRoute("/_app/healthy-living")({
  component: HealthyLivingPage,
});

interface Article {
  _id: string;
  title: string;
  author: string;
  readTimeMinutes: number;
  category: string;
  thumbnailUrl: string;
  content: string;
}

interface Recipe {
  _id: string;
  name: string;
  imageUrl: string;
  prepTimeMin: number;
  cookTimeMin: number;
  servings: number;
  caloriesPerServing: number;
  ingredients: string[];
  steps: string[];
  dietaryTags: string[];
  mealType: string;
}

interface Video {
  _id: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  category: string;
  description: string;
  videoUrl: string;
}

function HealthyLivingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Healthy Living</h1>
        <p className="text-sm text-muted-foreground">Expert articles, recipes, and wellness videos to support your health journey.</p>
      </div>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2 h-auto p-0">
          <TabsTrigger value="articles" className="data-[state=active]:bg-[#2cc9a8] data-[state=active]:text-white rounded-full px-4 py-2 flex items-center gap-2 bg-transparent border border-transparent data-[state=inactive]:text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Articles</span>
          </TabsTrigger>
          <TabsTrigger value="recipes" className="data-[state=active]:bg-[#2cc9a8] data-[state=active]:text-white rounded-full px-4 py-2 flex items-center gap-2 bg-transparent border border-transparent data-[state=inactive]:text-muted-foreground">
            <UtensilsCrossed className="h-4 w-4" />
            <span>Recipes</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="data-[state=active]:bg-[#2cc9a8] data-[state=active]:text-white rounded-full px-4 py-2 flex items-center gap-2 bg-transparent border border-transparent data-[state=inactive]:text-muted-foreground">
            <Video className="h-4 w-4" />
            <span>Videos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-6">
          <ArticlesTab />
        </TabsContent>

        <TabsContent value="recipes" className="space-y-6">
          <RecipesTab />
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <VideosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const categories = ["Nutrition", "Fitness", "Mental Health", "Sleep"];

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const data = await getArticles(selectedCategory || undefined);
        setArticles(data);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          className="rounded-full"
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Articles grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card
              key={article._id}
              className="cursor-pointer overflow-hidden transition-all hover:shadow-lg"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={article.thumbnailUrl}
                  alt={article.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg">{article.title}</CardTitle>
                </div>
                <CardDescription>{article.author}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{article.readTimeMinutes} min read</span>
                </div>
                <Badge variant="secondary">{article.category}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Article detail dialog */}
      {selectedArticle && (
        <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedArticle.title}</DialogTitle>
              <DialogDescription>
                By {selectedArticle.author} • {selectedArticle.readTimeMinutes} min read
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <img
                src={selectedArticle.thumbnailUrl}
                alt={selectedArticle.title}
                className="h-64 w-full rounded-lg object-cover"
              />
              <Badge>{selectedArticle.category}</Badge>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {selectedArticle.content.split("\n").map((line, idx) => {
                  if (line.startsWith("#")) {
                    const level = line.match(/^#+/)?.[0].length || 1;
                    const text = line.replace(/^#+\s/, "");
                    const HeadingTag = `h${Math.min(level + 1, 6)}` as keyof JSX.IntrinsicElements;
                    return (
                      <HeadingTag key={idx} className="mt-4 font-semibold">
                        {text}
                      </HeadingTag>
                    );
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <li key={idx} className="ml-4">
                        {line.replace(/^- /, "")}
                      </li>
                    );
                  }
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return (
                      <p key={idx} className="font-semibold">
                        {line.replace(/\*\*/g, "")}
                      </p>
                    );
                  }
                  if (line.trim()) {
                    return (
                      <p key={idx} className="text-sm leading-relaxed">
                        {line}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function RecipesTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDietaryTag, setSelectedDietaryTag] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  const dietaryTags = ["Vegan", "Vegetarian", "Pescatarian", "Keto", "Paleo", "Gluten-Free", "Dairy-Free", "High-Protein", "Mediterranean"];
  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const data = await getRecipes(selectedDietaryTag || undefined, selectedMealType || undefined);
        setRecipes(data);
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [selectedDietaryTag, selectedMealType]);

  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const data = await getFavouriteRecipes();
        setFavourites(data.map((r: Recipe) => r._id));
      } catch (error) {
        console.error("Failed to fetch favourites:", error);
      }
    };

    fetchFavourites();
  }, []);

  const handleToggleFavourite = async (recipeId: string) => {
    try {
      if (favourites.includes(recipeId)) {
        await removeRecipeFromFavourites(recipeId);
        setFavourites(favourites.filter((id) => id !== recipeId));
      } else {
        await saveRecipeToFavourites(recipeId);
        setFavourites([...favourites, recipeId]);
      }
    } catch (error) {
      console.error("Failed to toggle favourite:", error);
    }
  };

  const favouriteRecipes = recipes.filter((r) => favourites.includes(r._id));

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="space-y-6">
        {/* Search and Sort Row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search recipes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-lg border bg-card px-3 py-2 text-sm pr-8 cursor-pointer"
            >
              <option value="popular">Popular</option>
              <option value="newest">Newest</option>
              <option value="quickest">Quickest</option>
              <option value="lowest-cal">Lowest Cal</option>
            </select>
            <ArrowDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Dietary Tags</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedDietaryTag === null ? "default" : "outline"}
              onClick={() => setSelectedDietaryTag(null)}
              className="rounded-full flex-shrink-0"
            >
              All
            </Button>
            {dietaryTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedDietaryTag === tag ? "default" : "outline"}
                onClick={() => setSelectedDietaryTag(tag)}
                className={`rounded-full flex-shrink-0 ${selectedDietaryTag === tag ? "bg-[#2cc9a8] text-white font-bold" : "bg-muted text-muted-foreground"}`}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Meal Type</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedMealType === null ? "default" : "outline"}
              onClick={() => setSelectedMealType(null)}
              className="rounded-full"
            >
              All
            </Button>
            {mealTypes.map((type) => (
              <Button
                key={type}
                variant={selectedMealType === type ? "default" : "outline"}
                onClick={() => setSelectedMealType(type)}
                className="rounded-full"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Favourites section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">My Favourites</h3>
          <Badge variant="secondary" className="bg-[#2cc9a8] text-white">
            <Heart className="h-3 w-3 mr-1" />
            {favouriteRecipes.length} recipes saved
          </Badge>
        </div>
        {favouriteRecipes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favouriteRecipes.map((recipe) => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
                isFavourite={true}
                onToggleFavourite={handleToggleFavourite}
                onSelect={setSelectedRecipe}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Heart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No saved recipes yet. Click the heart icon to save your favorites!</p>
          </div>
        )}
      </div>

      {/* All recipes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Recipes</h3>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
                isFavourite={favourites.includes(recipe._id)}
                onToggleFavourite={handleToggleFavourite}
                onSelect={setSelectedRecipe}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recipe detail dialog */}
      {selectedRecipe && (
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRecipe.name}</DialogTitle>
              <DialogDescription>
                {selectedRecipe.servings} servings • {selectedRecipe.caloriesPerServing} cal per serving
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <img
                src={selectedRecipe.imageUrl}
                alt={selectedRecipe.name}
                className="h-64 w-full rounded-lg object-cover"
              />

              <div className="flex flex-wrap gap-2">
                {selectedRecipe.dietaryTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="text-sm font-semibold">{selectedRecipe.prepTimeMin} min</div>
                  <div className="text-xs text-muted-foreground">Prep</div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="text-sm font-semibold">{selectedRecipe.cookTimeMin} min</div>
                  <div className="text-xs text-muted-foreground">Cook</div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="text-sm font-semibold">{selectedRecipe.caloriesPerServing}</div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-semibold">Ingredients</h4>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-3 font-semibold">Steps</h4>
                <ol className="space-y-2">
                  {selectedRecipe.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-sm">
                      <span className="font-semibold text-primary">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Button
                onClick={() => handleToggleFavourite(selectedRecipe._id)}
                variant={favourites.includes(selectedRecipe._id) ? "default" : "outline"}
                className="w-full"
              >
                <Heart className="h-4 w-4" />
                {favourites.includes(selectedRecipe._id) ? "Remove from Favourites" : "Save to Favourites"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  isFavourite,
  onToggleFavourite,
  onSelect,
}: {
  recipe: Recipe;
  isFavourite: boolean;
  onToggleFavourite: (id: string) => void;
  onSelect: (recipe: Recipe) => void;
}) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg flex flex-col h-full">
      <div className="aspect-video overflow-hidden bg-muted relative group">
        <img src={recipe.imageUrl} alt={recipe.name} className="h-full w-full object-cover" />
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2 text-lg">{recipe.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1">
          {recipe.dietaryTags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs bg-[#2cc9a8] text-white">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{recipe.prepTimeMin + recipe.cookTimeMin} min</span>
          <span>{recipe.caloriesPerServing} cal</span>
        </div>
        <div className="flex gap-2 mt-auto">
          <Button onClick={() => onSelect(recipe)} variant="outline" className="flex-1">
            View Recipe
          </Button>
          <Button
            onClick={() => onToggleFavourite(recipe._id)}
            variant={isFavourite ? "default" : "outline"}
            size="icon"
          >
            <Heart className={`h-4 w-4 ${isFavourite ? "fill-current" : ""}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VideosTab() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["Meditation", "Yoga", "Nutrition", "Fitness"];

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const data = await getVideos(selectedCategory || undefined);
        setVideos(data);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          className="rounded-full"
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Videos grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video._id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="aspect-video overflow-hidden bg-muted relative group">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    onClick={() => window.open(video.videoUrl, "_blank")}
                    size="icon"
                    className="rounded-full"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-2 text-lg">{video.title}</CardTitle>
                <CardDescription className="line-clamp-2">{video.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{Math.floor(video.durationSeconds / 60)} min</span>
                  <Badge variant="secondary">{video.category}</Badge>
                </div>
                <Button
                  onClick={() => window.open(video.videoUrl, "_blank")}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4" />
                  Watch Video
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
