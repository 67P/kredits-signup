module.exports = function addContributor (kredits, contributorAttr) {
  return kredits.Contributor.add(contributorAttr, {gasLimit: 400000})
    .then(transaction => {
      console.log('Contributor added', transaction.hash);
      return transaction.wait(1)
        .then(confirmedTx => {
          return kredits.Contributor.findByAccount({
            site: 'github.com',
            username: contributorAttr.github_username
          });
        });
    });
}
