import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useBudget,
  useBudgetPeriods,
  useUpdateBudget,
  useCreateBudgetPeriod,
  useDeleteBudgetPeriod,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  BUDGET_PERIODS_QUERY_KEY,
  type Category,
} from "@/hooks/use-budget";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AlertTriangle, TrendingUp, BookOpen, ArrowRight, Plus, Edit2, Trash2, CalendarPlus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_COLORS = [
  "#3b82f6",
  "#eab308",
  "#ef4444",
  "#22c55e",
  "#8b5cf6",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
];

const SELECTED_BUDGET_KEY = "fm-selected-budget-id";

function formatPeriodLabel(periodIso: string): string {
  if (!periodIso) return "Period";
  const normalized = periodIso.includes("T") ? periodIso : `${periodIso}T12:00:00`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return periodIso;
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodToMonthValue(period: string): string {
  if (period.length >= 7) return period.slice(0, 7);
  return currentYearMonth();
}

export default function Budget() {
  const queryClient = useQueryClient();
  const { data: periods, isLoading: periodsLoading, isError: periodsError, error: periodsErr } =
    useBudgetPeriods();
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);

  useEffect(() => {
    if (!periods?.length) return;
    const saved = localStorage.getItem(SELECTED_BUDGET_KEY);
    const parsed = saved ? parseInt(saved, 10) : NaN;
    const fromStorage = periods.find((p) => p.id === parsed);
    setSelectedBudgetId(fromStorage?.id ?? periods[0].id);
  }, [periods]);

  const {
    data: budget,
    isLoading: budgetLoading,
    isError: budgetError,
    error: budgetErr,
  } = useBudget(selectedBudgetId ?? undefined);

  const updateBudget = useUpdateBudget();
  const createBudgetPeriod = useCreateBudgetPeriod();
  const deleteBudgetPeriod = useDeleteBudgetPeriod();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [isNewPeriodOpen, setIsNewPeriodOpen] = useState(false);
  const [isDeletePeriodOpen, setIsDeletePeriodOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  const [budgetTotal, setBudgetTotal] = useState("");
  const [editPeriodMonth, setEditPeriodMonth] = useState(currentYearMonth());

  const [newPeriodMonth, setNewPeriodMonth] = useState(currentYearMonth());
  const [newPeriodTotal, setNewPeriodTotal] = useState("2000");

  const [categoryName, setCategoryName] = useState("");
  const [categoryAmount, setCategoryAmount] = useState("");
  const [categoryColor, setCategoryColor] = useState(DEFAULT_COLORS[0]);

  const isLoading = periodsLoading || selectedBudgetId == null || budgetLoading;
  const isError = periodsError || budgetError;
  const error = periodsErr ?? budgetErr;

  const persistSelection = (id: number) => {
    setSelectedBudgetId(id);
    localStorage.setItem(SELECTED_BUDGET_KEY, String(id));
  };

  if (isLoading) {
    return <BudgetSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-8 space-y-2">
        <p className="font-medium text-destructive">Could not load your budget.</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Check that your database has the latest schema (see schema.sql for budget_categories columns) and try again."}
        </p>
      </div>
    );
  }

  if (!budget || !periods?.length) {
    return (
      <div className="p-8 space-y-2">
        <p className="text-muted-foreground">No budget found for your account.</p>
      </div>
    );
  }

  const chartData = budget.categories
    .map((cat) => ({
      name: cat.name,
      value: parseFloat(cat.allocatedAmount),
      color: cat.color || "#10b981",
    }))
    .filter((d) => d.value > 0);

  const totalAllocated = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const budgetTotalAmount = parseFloat(budget.totalAmount);
  const isOverBudget = totalAllocated > budgetTotalAmount;
  const overageAmount = isOverBudget ? totalAllocated - budgetTotalAmount : 0;
  const remainingAmount = budgetTotalAmount - totalAllocated;

  const chartDataWithRemaining =
    remainingAmount > 0
      ? [
          ...chartData,
          {
            name: "Remaining",
            value: remainingAmount,
            color: "#e5e7eb",
          },
        ]
      : chartData;

  const handleEditBudget = () => {
    setBudgetTotal(budget.totalAmount);
    setEditPeriodMonth(periodToMonthValue(budget.period));
    setIsEditBudgetOpen(true);
  };

  const handleSaveBudget = async () => {
    try {
      await updateBudget.mutateAsync({
        budgetId: budget.id,
        totalAmount: budgetTotal,
        period: `${editPeriodMonth}-01`,
      });
      setIsEditBudgetOpen(false);
    } catch (e) {
      console.error("Failed to update budget:", e);
    }
  };

  const handleOpenNewPeriod = () => {
    setNewPeriodMonth(currentYearMonth());
    setNewPeriodTotal("2000");
    setIsNewPeriodOpen(true);
  };

  const handleSaveNewPeriod = async () => {
    try {
      const created = await createBudgetPeriod.mutateAsync({
        totalAmount: newPeriodTotal,
        period: `${newPeriodMonth}-01`,
      });
      persistSelection(created.id);
      setIsNewPeriodOpen(false);
    } catch (e) {
      console.error("Failed to create budget period:", e);
    }
  };

  const confirmDeletePeriod = async () => {
    if (selectedBudgetId == null || periods.length <= 1) return;
    try {
      await deleteBudgetPeriod.mutateAsync(selectedBudgetId);
      const list = await queryClient.fetchQuery({
        queryKey: BUDGET_PERIODS_QUERY_KEY,
        queryFn: async () => {
          const res = await fetch("/api/budget/periods", { credentials: "include" });
          if (!res.ok) throw new Error("Failed to refresh periods");
          const data = (await res.json()) as { periods: { id: number }[] };
          return data.periods;
        },
      });
      if (list.length) {
        persistSelection(list[0].id);
      }
      setIsDeletePeriodOpen(false);
    } catch (e) {
      console.error("Failed to delete budget period:", e);
    }
  };

  const handleAddCategory = () => {
    setCategoryName("");
    setCategoryAmount("");
    setCategoryColor(DEFAULT_COLORS[0]);
    setIsAddCategoryOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      await createCategory.mutateAsync({
        budgetId: budget.id,
        name: categoryName,
        allocatedAmount: categoryAmount,
        color: categoryColor,
      });
      setIsAddCategoryOpen(false);
      setCategoryName("");
      setCategoryAmount("");
    } catch (e) {
      console.error("Failed to create category:", e);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryAmount(category.allocatedAmount);
    setCategoryColor(category.color);
    setIsEditCategoryOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        updates: {
          name: categoryName,
          allocatedAmount: categoryAmount,
          color: categoryColor,
        },
      });
      setIsEditCategoryOpen(false);
      setEditingCategory(null);
    } catch (e) {
      console.error("Failed to update category:", e);
    }
  };

  const handleDeleteCategory = (id: number) => {
    setDeletingCategoryId(id);
    setIsDeleteCategoryOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (deletingCategoryId == null) return;
    try {
      await deleteCategory.mutateAsync({ id: deletingCategoryId, budgetId: budget.id });
      setIsDeleteCategoryOpen(false);
      setDeletingCategoryId(null);
    } catch (e) {
      console.error("Failed to delete category:", e);
    }
  };

  const canDeletePeriod = periods.length > 1;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Monthly Budget</h1>
          <p className="text-muted-foreground mt-1">Manage your spending and savings goals</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full min-w-0 sm:max-w-md sm:flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Budget period</Label>
            <Select
              value={String(selectedBudgetId ?? budget.id)}
              onValueChange={(v) => persistSelection(parseInt(v, 10))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {formatPeriodLabel(p.period)} · $
                    {parseFloat(p.totalAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
            <Button type="button" variant="secondary" size="sm" onClick={handleOpenNewPeriod}>
              <CalendarPlus className="w-4 h-4" />
              New period
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canDeletePeriod || deleteBudgetPeriod.isPending}
              onClick={() => setIsDeletePeriodOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Delete period
            </Button>
            <Button type="button" onClick={handleEditBudget} variant="outline" size="sm">
              <Edit2 className="w-4 h-4" />
              Edit budget
            </Button>
          </div>
        </div>

        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-medium text-sm inline-flex items-center gap-2 w-fit">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {formatPeriodLabel(budget.period)}
        </div>
      </div>

      {isOverBudget && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-destructive/20 p-3 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-destructive mb-1">Over Budget Warning</h3>
              <p className="text-destructive/90 mb-3">
                Your allocated categories total{" "}
                <span className="font-bold">
                  ${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                , which exceeds your budget of{" "}
                <span className="font-bold">
                  ${budgetTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                .
              </p>
              <p className="text-sm font-semibold text-destructive">
                You are over by:{" "}
                <span className="text-lg">
                  ${overageAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-2xl border shadow-sm p-8">
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Total Monthly Budget
            </h2>
            <div className="text-5xl font-bold font-display text-foreground mb-8">
              ${parseFloat(budget.totalAmount).toLocaleString()}
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataWithRemaining}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={140}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartDataWithRemaining.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="bg-white/10 w-fit p-3 rounded-xl mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">Dive Deeper</h3>
              <p className="text-slate-300 text-sm mb-6">
                Analyze your spending habits to find where you can save more.
              </p>
              <Link href="/chat">
                <button className="w-full bg-white text-slate-900 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-colors">
                  Analyze Spending
                </button>
              </Link>
            </div>
          </div>

          <div className="bg-card border p-6 rounded-2xl shadow-sm">
            <div className="bg-primary/10 w-fit p-3 rounded-xl mb-4 text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">Budgeting 101</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Learn the 50/30/20 rule and how to apply it to your finances.
            </p>
            <Link href="/modules">
              <button className="w-full border border-border bg-background text-foreground py-3 rounded-xl font-semibold text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2">
                Start Learning
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-foreground">
            ${budgetTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Allocated</p>
          <p className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : "text-foreground"}`}>
            ${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div
          className={`bg-card rounded-xl border shadow-sm p-4 ${isOverBudget ? "border-destructive/20 bg-destructive/5" : ""}`}
        >
          <p className="text-sm text-muted-foreground mb-1">{isOverBudget ? "Over Budget" : "Remaining"}</p>
          <p className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : "text-emerald-600"}`}>
            {isOverBudget ? "-" : ""}$
            {Math.abs(budgetTotalAmount - totalAllocated).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-display">Budget Categories</h2>
          <Button onClick={handleAddCategory} size="sm">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>

        <div className="space-y-3">
          {budget.categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${parseFloat(category.allocatedAmount).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {remainingAmount > 0 && (
            <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 font-semibold">
                  R
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Remaining</p>
                  <p className="text-sm text-muted-foreground">
                    ${remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}
          {budget.categories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No categories yet. Add your first category to get started.
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditBudgetOpen} onOpenChange={setIsEditBudgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit budget</DialogTitle>
            <DialogDescription>Update the total and month for this budget period.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total amount</Label>
              <Input
                id="totalAmount"
                type="number"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                placeholder="2000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodMonth">Month</Label>
              <Input
                id="periodMonth"
                type="month"
                value={editPeriodMonth}
                onChange={(e) => setEditPeriodMonth(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditBudgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBudget} disabled={updateBudget.isPending}>
              {updateBudget.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewPeriodOpen} onOpenChange={setIsNewPeriodOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New budget period</DialogTitle>
            <DialogDescription>
              Creates a new month with a $2,000 total and the same starter categories (you can edit them afterward).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPeriodMonth">Month</Label>
              <Input
                id="newPeriodMonth"
                type="month"
                value={newPeriodMonth}
                onChange={(e) => setNewPeriodMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPeriodTotal">Monthly total</Label>
              <Input
                id="newPeriodTotal"
                type="number"
                value={newPeriodTotal}
                onChange={(e) => setNewPeriodTotal(e.target.value)}
                placeholder="2000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPeriodOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewPeriod}
              disabled={createBudgetPeriod.isPending || !newPeriodMonth || !newPeriodTotal}
            >
              {createBudgetPeriod.isPending ? "Creating..." : "Create period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeletePeriodOpen} onOpenChange={setIsDeletePeriodOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this budget period?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the period <strong>{formatPeriodLabel(budget.period)}</strong> and all of its categories.
              You must keep at least one period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBudgetPeriod.isPending}
              onClick={() => void confirmDeletePeriod()}
            >
              {deleteBudgetPeriod.isPending ? "Deleting..." : "Delete period"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new budget category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Rent, Groceries"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryAmount">Allocated Amount</Label>
              <Input
                id="categoryAmount"
                type="number"
                value={categoryAmount}
                onChange={(e) => setCategoryAmount(e.target.value)}
                placeholder="500.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      categoryColor === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={createCategory.isPending || !categoryName || !categoryAmount}
            >
              {createCategory.isPending ? "Adding..." : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategoryAmount">Allocated Amount</Label>
              <Input
                id="editCategoryAmount"
                type="number"
                value={categoryAmount}
                onChange={(e) => setCategoryAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      categoryColor === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={updateCategory.isPending || !categoryName || !categoryAmount}
            >
              {updateCategory.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteCategoryOpen} onOpenChange={setIsDeleteCategoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BudgetSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="lg:col-span-2 h-[500px] rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
