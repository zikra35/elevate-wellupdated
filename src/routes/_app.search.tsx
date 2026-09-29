import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, TrendingUp, Clock, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WellnessState {
  nutrition: number;
  physical: number;
  sleep: number;
  mental: number;
  readinessScore?: number;
}

interface PathStep {
  step: number;
  action: string;
  actionName: string;
  description: string;
  estimatedTime: number;
  expectedImpact: {
    nutrition: number;
    physical: number;
    sleep: number;
    mental: number;
  };
  resultingState: WellnessState;
}

interface WellnessPath {
  success: boolean;
  algorithm: string;
  initialState: WellnessState;
  goalState: WellnessState;
  path: PathStep[];
  pathLength: number;
  totalCost: number;
  totalTime: string;
  nodesExplored: number;
  executionTime: string;
  pathId: string;
  message: string;
}

interface AlgorithmComparison {
  initialState: WellnessState;
  goalState: WellnessState;
  bfs: {
    found: boolean;
    pathLength: number;
    totalCost: number;
    nodesExplored: number;
    executionTime: string;
  };
  aStar: {
    found: boolean;
    pathLength: number;
    totalCost: number;
    nodesExplored: number;
    executionTime: string;
  };
  comparison: {
    bfsIsShorter: boolean;
    aStarIsCheaper: boolean;
    bfsExploredMore: boolean;
    recommendation: string;
  };
}

function SearchPage() {
  const [currentState, setCurrentState] = useState<WellnessState | null>(null);
  const [goalState, setGoalState] = useState<WellnessState>({
    nutrition: 80,
    physical: 80,
    sleep: 80,
    mental: 80,
  });
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'BFS' | 'A*'>('A*');
  const [path, setPath] = useState<WellnessPath | null>(null);
  const [comparison, setComparison] = useState<AlgorithmComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current state on mount
  useEffect(() => {
    loadCurrentState();
  }, []);

  const loadCurrentState = async () => {
    try {
      const response = await fetch('/api/search/current-state');
      if (!response.ok) throw new Error('Failed to load current state');
      const data = await response.json();
      setCurrentState(data.currentState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load current state');
    }
  };

  const handleFindPath = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/search/find-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithm: selectedAlgorithm,
          goalState,
          maxSteps: 20,
        }),
      });

      if (!response.ok) throw new Error('Failed to find path');
      const data = await response.json();
      setPath(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find path');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareAlgorithms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/search/compare-algorithms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalState }),
      });

      if (!response.ok) throw new Error('Failed to compare algorithms');
      const data = await response.json();
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare algorithms');
    } finally {
      setLoading(false);
    }
  };

  const updateGoalState = (key: keyof WellnessState, value: number) => {
    setGoalState((prev) => ({
      ...prev,
      [key]: Math.min(100, Math.max(0, value)),
    }));
  };

  const StateBar = ({ label, value, max = 100 }: { label: string; value: number; max?: number }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{Math.round(value)}/{max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Wellness Path Finder</h1>
          <p className="text-gray-600">
            Use BFS and A* algorithms to find optimal wellness paths
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current State</CardTitle>
              <CardDescription>Your wellness metrics today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentState ? (
                <>
                  <StateBar label="Nutrition" value={currentState.nutrition} />
                  <StateBar label="Physical" value={currentState.physical} />
                  <StateBar label="Sleep" value={currentState.sleep} />
                  <StateBar label="Mental" value={currentState.mental} />
                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Readiness Score</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {currentState.readinessScore || 0}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goal State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Goal State</CardTitle>
              <CardDescription>Set your wellness targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Nutrition</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={goalState.nutrition}
                    onChange={(e) => updateGoalState('nutrition', parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Physical</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={goalState.physical}
                    onChange={(e) => updateGoalState('physical', parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sleep</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={goalState.sleep}
                    onChange={(e) => updateGoalState('sleep', parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mental</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={goalState.mental}
                    onChange={(e) => updateGoalState('mental', parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Algorithm Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Algorithm</CardTitle>
              <CardDescription>Choose search algorithm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="algorithm"
                    value="BFS"
                    checked={selectedAlgorithm === 'BFS'}
                    onChange={(e) => setSelectedAlgorithm(e.target.value as 'BFS' | 'A*')}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">BFS</p>
                    <p className="text-xs text-muted-foreground">Shortest path (fewest steps)</p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="algorithm"
                    value="A*"
                    checked={selectedAlgorithm === 'A*'}
                    onChange={(e) => setSelectedAlgorithm(e.target.value as 'BFS' | 'A*')}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">A*</p>
                    <p className="text-xs text-muted-foreground">Optimal path (minimum cost)</p>
                  </div>
                </label>
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleFindPath}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding Path...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Find Path
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCompareAlgorithms}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Comparing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Compare
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {path && (
          <Card>
            <CardHeader>
              <CardTitle>
                {path.algorithm} Results
                {path.success ? ' ✓' : ' ✗'}
              </CardTitle>
              <CardDescription>{path.message}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Path Length</p>
                  <p className="text-2xl font-bold">{path.pathLength}</p>
                  <p className="text-xs text-muted-foreground">steps</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Time</p>
                  <p className="text-2xl font-bold">{path.totalTime}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Nodes Explored</p>
                  <p className="text-2xl font-bold">{path.nodesExplored}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Execution Time</p>
                  <p className="text-2xl font-bold">{path.executionTime}</p>
                </div>
              </div>

              {/* Path Steps */}
              {path.path.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Recommended Actions</h3>
                  <div className="space-y-3">
                    {path.path.map((step, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">
                              Step {step.step}: {step.actionName}
                            </p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{step.estimatedTime} min</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {Object.entries(step.expectedImpact).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <p className="text-xs text-muted-foreground capitalize">{key}</p>
                              <p className="text-sm font-semibold text-green-600">+{value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(step.resultingState).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs text-muted-foreground capitalize">{key}</p>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: `${(value / 100) * 100}%` }}
                                />
                              </div>
                              <p className="text-xs font-medium mt-1">{Math.round(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Comparison Results */}
        {comparison && (
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Comparison</CardTitle>
              <CardDescription>{comparison.comparison.recommendation}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bfs" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bfs">BFS</TabsTrigger>
                  <TabsTrigger value="astar">A*</TabsTrigger>
                </TabsList>

                <TabsContent value="bfs" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Path Length</p>
                      <p className="text-2xl font-bold">{comparison.bfs.pathLength}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="text-2xl font-bold">{comparison.bfs.totalCost} min</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Nodes Explored</p>
                      <p className="text-2xl font-bold">{comparison.bfs.nodesExplored}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Execution Time</p>
                      <p className="text-2xl font-bold">{comparison.bfs.executionTime}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="astar" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Path Length</p>
                      <p className="text-2xl font-bold">{comparison.aStar.pathLength}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="text-2xl font-bold">{comparison.aStar.totalCost} min</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Nodes Explored</p>
                      <p className="text-2xl font-bold">{comparison.aStar.nodesExplored}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Execution Time</p>
                      <p className="text-2xl font-bold">{comparison.aStar.executionTime}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_app/search')({
  component: SearchPage,
});
