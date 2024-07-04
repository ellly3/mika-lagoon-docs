# ワークフロー

Lagoonは、可能な限り多様な開発ワークフローをサポートしようとしています。特に、チームに対して特定のワークフローを強制することなく、各開発チームが自分たちのコードをどのように開発しデプロイするかを定義できます。

## 固定ブランチ { #fixed-branches }

最も直接的なワークフローは、いくつかの固定ブランチに基づいたデプロイメントです:

Lagoonがデプロイすべきブランチ(例えば `develop`、`staging`、`main`など、これらは正規表現で `^(develop|staging|main)$`となります)を定義し、それを実行します。それで完了です！

新しい機能をテストしたい場合は、ローカルで設定したブランチにそれらをマージしてプッシュし、Lagoonがその機能をデプロイします。すべてが良ければ、そのブランチをあなたの本番ブランチにマージしてプッシュします。

## フィーチャーブランチ { #feature-branches }

もう少し高度なものになると、フィーチャーブランチがあります。Lagoonは、デプロイしたいブランチを正規表現で定義する能力をサポートしているので、上記の正規表現をこのように拡張することもできます:`^feature\/|^(staging|main)$`。これにより、Lagoonは`feature/`で始まるすべてのブランチ、および`staging`と`main`という名前のブランチをデプロイするよう指示します。私たちの開発ワークフローは以下のようになるかもしれません:

* 新しいブランチを作成する `main`から`feature/myfeature`を呼び出し、`feature/myfeature`をプッシュします。
* Lagoonは、`feature/myfeature`ブランチを新しい環境としてデプロイし、他の機能とは独立して機能をテストできます。
* `feature/myfeature`を`main`ブランチにマージすると、それはあなたの本番環境にデプロイされます。

もしご希望であれば、`feature/myfeature`や他の機能ブランチを最初に`staging`にマージして、複数の機能の機能性を一緒にテストすることもできます。ステージングで機能を一緒にテストした後、機能をmainにマージできます。

このワークフローは、Gitリポジトリのブランチの剪定と清潔さを高度に必要とします。各機能ブランチは自身のLagoon環境を作成するため、非常にすぐに大量の環境を生成することができ、それら全てがリソースを使用します。未使用のブランチをマージするか削除することを確認してください。

このため、プルリクエストベースのワークフローを考えることが理にかなっているかもしれません。

## プルリクエスト { #pull-requests }

さらに高度なワークフローはプルリクエストを介したものです。このようなワークフローは、プルリクエスト(またはマージリクエストとも呼ばれる)をサポートするGitホスティングのサポートが必要です。プルリクエストベースのワークフローのアイデアは、その背後にあります。 あなたが特定の機能をターゲットブランチと一緒にテストできるというアイデアは、実際にはまだマージする必要はないが、Lagoonがビルド中にマージしてくれるというものです。

私たちの例では、Lagoonを設定して、ブランチ`^(staging|main)$`とプルリクエストを`.*` \(すべてのプルリクエストをデプロイする\)にデプロイさせます。 これで、私たちのワークフローは次のようになります:

1. `main`から新しいブランチ`feature/myfeature`を作成し、`feature/myfeature`をプッシュします\(私たちがデプロイするブランチとして特定のステージングとメインのみを持っているため、今はデプロイは行われません\)。
2. あなたのGitホスティングで`feature/myfeature`から`main`へのプルリクエストを作成します。
3. Lagoonは今、`feature/myfeature`ブランチを`main`ブランチの上にマージし、その結果のコードをデプロイします。
4. これで、`feature/myfeature`ブランチの機能をテストできます。まるで`main`にマージされたかのように、`feature/myfeature`ブランチを作成してから`main`で起こったすべての変更がそこにありますので、`main`ブランチの古いバージョンを持っているかもしれないと心配する必要はありません。
   1. マージの競合がある場合、ビルドが失敗し、Lagoonは停止してあなたに通知します。
5. あなたがプルリクエストのテストを終えた後 リクエストブランチでは、Gitホスティングに戻って実際にコードを`main`にマージすることができます。これにより、`main`のデプロイがトリガーされます。
6. プルリクエストがマージされると、自動的にクローズされ、Lagoonはプルリクエストの環境を自動的に削除します。

一部のチームでは、共有の`staging`ブランチに対してプルリクエストを作成し、その後、別のプルリクエストを介して`staging`ブランチを`main`ブランチにマージすることを選択するかもしれません。これは、使用しているGitのワークフローの種類によります。

また、Lagoonでは、タイトルに特定のテキストがあるプルリクエストのみをデプロイするように設定することができます。正規表現として定義された`[BUILD]`は、タイトルが`[BUILD] My Pull Request`のようなプルリクエストのみをデプロイし、タイトルが`My other Pull Request`のプルリクエストは自動的にデプロイされません。これにより、環境の数を少なく保つことができ、また、まだ環境が必要でないプルリクエストを許可することができます。

### プルリクエストの自動データベース同期 { #automatic-database-sync-for-pull-requests }

自動的なプルリクエストの環境は素晴らしいことです。しかし、それらの環境が作成されたときに別の環境からデータベースが同期されると便利だろうとも思います。Lagoonはそれを扱うことができます！

これは 次の例は、プルリクエスト環境の最初のロールアウトでステージングデータベースを同期します:

```yaml title=".lagoon.yml"
tasks:
  post-rollout:
    - run:
        name: IF no Drupal installed & Pullrequest = Sync database from staging
        command: |
            if [[ -n ${LAGOON_PR_BASE_BRANCH} ]] && tables=$(drush sqlq 'show tables;') && [ -z "$tables" ]; then
                drush -y sql-sync @staging default
            fi
        service: cli
        shell: bash
```

## プロモーション { #promotion }

環境にコードをデプロイする別の方法は、**プロモーション**ワークフローです。

プロモーションワークフローの背後にある考え方は次のようなものです(例として):

`staging`ブランチを`main`ブランチにマージし、`main`に変更がなければ、つまり`main`と`staging`がGitでまったく同じコードを持っている場合でも、結果として得られるDockerイメージがわずかに異なる可能性があります。これは、最後の`staging`デプロイメントと現在の`main`デプロイメントの間に、いくつかの上流Dockerイメージが変更されたか、またはさまざまなパッケージマネージャーからロードされた依存関係が変更された可能性があるためです。これは非常に小さい確率ですが、存在します。

そのため、 この状況では、Lagoonは一つの環境から別の環境へのLagoonイメージのプロモーションという概念を理解しています。これは基本的に、すでに構築されデプロイされたDockerイメージを一つの環境から取り出し、それらのまったく同じDockerイメージを別の環境で使用するということを意味します。

私たちの例では、`main`環境から`production`環境へDockerイメージをプロモートしたいと思っています:

* 最初に、`main`という名前の通常のデプロイ環境が必要です。環境が正常にデプロイされていることを確認してください。
* また、Gitリポジトリに`production`という名前のブランチがないことを確認してください。これがあると、人々がこのブランチにプッシュするなど、奇妙な混乱を引き起こす可能性があります。
* 次に、[lagoon cli](https://github.com/uselagoon/lagoon-cli)を使用してプロモーションデプロイメントをトリガーします:

```title="プロモーションデプロイメントをトリガーする"
lagoon deploy promote --project="myproject" --source="main" --destination="production"
```

これは、ソース`main`からデスティネーション`production`へのプロモーションを希望することをLagoonに伝えます。

Lagoonは次のことを行います:

* `.lagoon.yml`と`docker-compose.yml`ファイルをロードするために、Gitブランチ`main`をチェックアウトします(Lagoonはこれらがまだ必要です 完全に動作するために)。
* `docker-compose.yml`で定義されたサービスのすべてのKubernetes/OpenShiftオブジェクトを作成しますが、環境変数として`LAGOON_GIT_BRANCH=production`を使用します。
* `main`環境から最新のイメージをコピーし、それらを使用します(イメージをビルドしたり、上流からタグ付けしたりする代わりに)。
* 通常のデプロイメントのように、すべてのポストロールアウトタスクを実行します。

他のデプロイメントと同様に、成功または失敗の通知を受け取ります。