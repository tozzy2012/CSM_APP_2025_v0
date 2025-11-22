    return {
      total,
      healthy,
      atRisk,
      critical,
      totalMRR,
      avgHealthScore: Math.round(avgHealthScore),
    };
  };

  return {
    accounts,
    getAccount,
    getAccountsByOrganization,
    createAccount,
    updateAccount,
    deleteAccount,
    getStats,
  };
}
