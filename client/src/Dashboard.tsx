            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">MRR Total</p>
              <p className="text-3xl font-bold mt-1">
                R$ {(stats.totalMRR / 1000).toFixed(1)}K
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Accounts em Risco</p>
              <p className="text-3xl font-bold mt-1 text-red-600">
                {stats.atRisk + stats.critical}
              </p>
              <p className="text-xs text-red-600 mt-1">Requer atenção</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Main Content - Tabs */}
      <Tabs defaultValue="kanban" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kanban">
            <KanbanIcon className="w-4 h-4 mr-2" />
            Kanban Board
          </TabsTrigger>
          <TabsTrigger value="executive">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard Executivo