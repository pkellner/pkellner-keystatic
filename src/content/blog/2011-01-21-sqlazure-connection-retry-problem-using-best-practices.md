---
status: publish
published: true
pubDatetime: 2011-01-21T20:00:00.000Z
title: SqlAzure and a Best Practices way to deal with the Required Retries on Connections
author:
  display_name: Peter Kellner
  login: admin
  email: peter@peterkellner.net
  url: ''
author_login: admin
author_email: peter@peterkellner.net
wordpress_id: 1429
wordpress_url: https://peterkellner.net/2011/01/21/sqlazure-connection-retry-problem-using-best-practices/
date: '2011-01-21 15:24:44 -0800'
date_gmt: '2011-01-21 22:24:44 -0800'
categories:
- Best Practices
- C#
- web
- SQL Server
- Azure
- ASP.NET 4.0
- SqlAzure
- Connection
- Web.Config
tags: []
---
<h2>Introduction</h2>
<p>If you’ve started using <a href="http://msdn.microsoft.com/en-us/library/ee336279.aspx">SqlAzure</a> for your <a href="http://www.microsoft.com/sqlserver/2008/en/us/r2.aspx">SqlServer</a> with your Azure application, you’ve probably discovered that you get a reasonable number of <a href="http://msdn.microsoft.com/en-us/library/aa175395(v=sql.80).aspx">connection</a> failures.&#160; The advice from the Azure team is add retry logic to all your connections to SqlAzure. There is a long discussion posted by the Azure team <a href="http://blogs.msdn.com/b/bartr/archive/2010/06/18/sql-azure-connection-retry.aspx?utm_source=feedburner&amp;utm_medium=twitter&amp;utm_campaign=Feed%3A+Microsoft%2FMSDN-Blogs+(MSDN+Blogs)">here</a>.</p>
<p>The key paragraph states the problem as follows:</p>
<blockquote><p><strong>The Problem       <br /></strong>One of the things that SQL Azure does to deliver high availability is it sometimes closes <a href="http://msdn.microsoft.com/en-us/library/ee336245.aspx">connections</a>. SQL Azure does some pretty cool stuff under the covers to minimize the impact, but this is a key difference in SQL Azure development vs. SQL Server development.</p>
</blockquote>
<p>Basically, what this means is that you must be able to deal with connections failing when you call SqlAzure.&#160; Something that all of probably should have been doing forever, but because most of the time SqlServer is running on your local LAN and the likelihood if a connection failing was next to zero unless something else was going terribly wrong.&#160; Certainly not something we had to do on regular basis.&#160; To emphasize that even more, most of the controls built into asp.net that open connections to sqlserver don’t even do this and that’s from Microsoft itself.</p>
<p>The solution proposed in the thread mentioned above basically has you add tons of code to everyplace you access a connection object.&#160; Personally, I don’t like that because I have hundreds if not thousands of places I open connections and inserting tens of thousands of lines of extra new untested code is a little scary.</p>
<p>So, what to do?</p>
<p>Fortunately, another team at Microsoft, known as the <a href="http://blogs.msdn.com/b/appfabriccat">Windows Server AppFabric Customer Advisory Team</a> published a general purpose solution using Extension Methods and some darn clever coding wrote a <a href="http://blogs.msdn.com/b/appfabriccat/archive/2010/12/11/sql-azure-and-entity-framework-connection-fault-handling.aspx">great article and published code</a> including <a href="http://blogs.msdn.com/b/appfabriccat/archive/2010/10/28/best-practices-for-handling-transient-conditions-in-sql-azure-client-applications.aspx">azure examples</a> that solves this problem very elegantly without requiring a lot of changes to your existing code base.</p>
<p>In this article I plan on giving an example and publishing a sample project that uses this code with SqlAzure to solve the connection retry problem.&#160; My goal here is not to simply restate what they published but to simply have a very simple concrete example of using their library.</p>
<p>  <!--more--><br />
<h2>Design Goal</h2>
<p>We have two goals.</p>
<ol>
<li>
<div align="left">Change as little code as possible</div>
</li>
<li>
<div align="left">Log Connection Errors when they happen With Locations</div>
</li>
<li>
<div align="left">Make sure not to trap errors that are NOT connection related such as bad column names</div>
</li>
</ol>
<p align="left">&#160;</p>
<h2 align="left">Incorrect Code</h2>
<p align="left">So, this is what the original code looks like that will fail because it does not have connection retry logic:</p>
<p align="left">&#160;</p>
<div id="codeSnippetWrapper">
<pre style="border-bottom-style: none; text-align: left; padding-bottom: 0px; line-height: 12pt; border-right-style: none; background-color: #f4f4f4; margin: 0em; padding-left: 0px; width: 100%; padding-right: 0px; font-family: &#39;Courier New&#39;, courier, monospace; direction: ltr; border-top-style: none; color: black; font-size: 8pt; border-left-style: none; overflow: visible; padding-top: 0px" id="codeSnippet"><span style="color: #0000ff">public</span> <span style="color: #0000ff">static</span> <span style="color: #0000ff">int</span> UsersIdFromUserNameNoConnectionRetry(<span style="color: #0000ff">string</span> userName)<br />{<br />    var retUsersId = 0;<br />    <span style="color: #0000ff">const</span> <span style="color: #0000ff">string</span> sql =<br />        <span style="color: #006080">@&quot;SELECT Id FROM Users<br />            WHERE Username = @Username&quot;</span>;<br /><br />    <span style="color: #0000ff">using</span> (var sqlConnection = <span style="color: #0000ff">new</span> SqlConnection(<br />            ConfigurationManager.ConnectionStrings[<span style="color: #006080">&quot;CRStorageWebConnectionString&quot;</span>].<br />            ConnectionString))<br />    {<br />        sqlConnection.Open();<br />        <span style="color: #0000ff">using</span> (var sqlCommand = <span style="color: #0000ff">new</span> SqlCommand(sql, sqlConnection))<br />        {<br />            sqlCommand.Parameters.Add(<span style="color: #006080">&quot;@Username&quot;</span>, SqlDbType.NVarChar).Value = userName;<br />            <span style="color: #0000ff">using</span> (var reader = sqlCommand.ExecuteReader())<br />            {<br />                <span style="color: #0000ff">while</span> (reader.Read())<br />                {<br />                    retUsersId = reader.IsDBNull(0) ? 0 : reader.GetInt32(0);<br />                }<br />            }<br />        }<br />    }<br />    <span style="color: #0000ff">return</span> retUsersId;<br />}</pre>
<p></div>
<p align="left">So, if there is a connection, an exception will get thrown and will need to be caught, but then the method will not have done it’s job.</p>
<p align="left">&#160;</p>
<h2 align="left">Correct Code With Retries</h2>
<p align="left">So, now take a look at the revised code after the library is setup and used.&#160; The setup is non-trivial, but you just have to do that once and then you can simply fix all your other code with very few changes.&#160; Below is the new code with connection retry logic built in.</p>
<p align="left">&#160;</p>
<div id="codeSnippetWrapper">
<pre style="border-bottom-style: none; text-align: left; padding-bottom: 0px; line-height: 12pt; border-right-style: none; background-color: #f4f4f4; margin: 0em; padding-left: 0px; width: 100%; padding-right: 0px; font-family: &#39;Courier New&#39;, courier, monospace; direction: ltr; border-top-style: none; color: black; font-size: 8pt; border-left-style: none; overflow: visible; padding-top: 0px" id="codeSnippet"><span style="color: #0000ff">public</span> <span style="color: #0000ff">static</span> <span style="color: #0000ff">int</span> UsersIdFromUserName(<span style="color: #0000ff">string</span> userName)<br />{<br />    var retUsersId = 0;<br />    <span style="color: #0000ff">const</span> <span style="color: #0000ff">string</span> sql =<br />        <span style="color: #006080">@&quot;SELECT Id FROM Users<br />            WHERE Username = @Username&quot;</span>;<br /><br />    <span style="color: #0000ff">using</span> (var sqlConnection =<br />        <span style="color: #0000ff">new</span> ReliableSqlConnection(<br />            ConfigurationManager.ConnectionStrings[<span style="color: #006080">&quot;CRStorageWebConnectionString&quot;</span>].<br />            ConnectionString,<br />            <span style="color: #0000ff">new</span> RetryUtils(<span style="color: #006080">&quot;&quot;</span>, <span style="color: #006080">&quot;UsersIdFromUserName&quot;</span>).GetRetryPolicy()))<br />    {<br />        sqlConnection.Open();<br />        <span style="color: #0000ff">using</span> (var sqlCommand = <span style="color: #0000ff">new</span> SqlCommand(sql, sqlConnection.Current))<br />        {<br />            sqlCommand.Parameters.Add(<span style="color: #006080">&quot;@Username&quot;</span>, SqlDbType.NVarChar).Value = userName;<br />            <span style="color: #0000ff">using</span> (var reader = sqlCommand.ExecuteReader())<br />            {<br />                <span style="color: #0000ff">while</span> (reader.Read())<br />                {<br />                    retUsersId = reader.IsDBNull(0) ? 0 : reader.GetInt32(0);<br />                }<br />            }<br />        }<br />    }<br />    <span style="color: #0000ff">return</span> retUsersId;<br />}</pre>
</div>
<div>&#160;</div>
<div>There are basically two changes.&#160; </div>
<div>&#160;</div>
<ol>
<li>The first is instead of create an SqlConnection(…) we are creating a ReliableSqlConnection(…).&#160; The ReliableSqlConnection takes an extra parameter which basically wraps the retry logic used, as well as labelling this connection so when it fails, it gets logged.&#160; In the log, there will be the comment “UsersIdFromUserName” so we know what method threw the retry.</li>
<li>The second is slight change we when we create the SqlCommand, we have to add the property .Current to it so we know we are talking about the currently executing connection.&#160; There may be a default way to handle this but I could not figure it out.</li>
</ol>
<div>That’s it!&#160; you are new connection safe for retrying failed connections.</div>
<div>&#160;</div>
<h2>The Setup Pieces</h2>
<div>&#160;</div>
<div>First, download the library from the article mention above which can be found here in <a href="http://code.msdn.microsoft.com/">Microsoft’s Code Gallery</a></div>
<div>&#160;</div>
<div><a title="http://code.msdn.microsoft.com/Project/Download/FileDownload.aspx?ProjectName=appfabriccat&amp;DownloadId=14007" href="http://code.msdn.microsoft.com/Project/Download/FileDownload.aspx?ProjectName=appfabriccat&amp;DownloadId=14007">http://code.msdn.microsoft.com/Project/Download/FileDownload.aspx?ProjectName=appfabriccat&amp;DownloadId=14007</a></div>
<div>&#160;</div>
<p>The project has all kinds of stuff in it that build quite nicely, run and test under vs2010.&#160; All I’m interested in is the ado.net piece and the retry logic around that.&#160; I actually used the 1.2 version, however I now see there is a 1.3 version with some improvements.&#160; I would post my project but I don’t want to post it with old code so I’ll just tell you the steps I went through so you can do the same.</p>
<h3>Build the class library</h3>
<p>Compile the project and make sure you have the dll from the library lincluded in your actual visual studio project.&#160; The library you want is Microsoft.AppFabricCAT.Samples.Azure.TransientFaultHandling.</p>
<p>&#160;</p>
<p><a href="/FilesForWebDownload/SqlAzure-and-a-Best-Practices-way-to-dea_E1CC/image.png"><img style="background-image: none; border-bottom: 0px; border-left: 0px; padding-left: 0px; padding-right: 0px; display: inline; border-top: 0px; border-right: 0px; padding-top: 0px" title="image" border="0" alt="image" src="/FilesForWebDownload/SqlAzure-and-a-Best-Practices-way-to-dea_E1CC/image_thumb.png" width="347" height="243" /></a></p>
<p>&#160;</p>
<h3>Update Your Web.config</h3>
<p>Add the config section below to your web.config file.</p>
<div id="codeSnippetWrapper">
<pre style="border-bottom-style: none; text-align: left; padding-bottom: 0px; line-height: 12pt; border-right-style: none; background-color: #f4f4f4; margin: 0em; padding-left: 0px; width: 100%; padding-right: 0px; font-family: &#39;Courier New&#39;, courier, monospace; direction: ltr; border-top-style: none; color: black; font-size: 8pt; border-left-style: none; overflow: visible; padding-top: 0px" id="codeSnippet"><span style="color: #0000ff">&lt;</span><span style="color: #800000">configSections</span><span style="color: #0000ff">&gt;</span><br />    <span style="color: #0000ff">&lt;</span><span style="color: #800000">section</span> <span style="color: #ff0000">name</span><span style="color: #0000ff">=&quot;RetryPolicyConfiguration&quot;</span> <br />         <span style="color: #ff0000">type</span><span style="color: #0000ff">=&quot;Microsoft.AppFabricCAT.Samples.Azure.TransientFaultHandling.Configuration.RetryPolicyConfigurationSettings,<br />            Microsoft.AppFabricCAT.Samples.Azure.TransientFaultHandling&quot;</span> <span style="color: #0000ff">/&gt;</span><br /><span style="color: #0000ff">&lt;/</span><span style="color: #800000">configSections</span><span style="color: #0000ff">&gt;</span><br /><br /><span style="color: #0000ff">&lt;</span><span style="color: #800000">RetryPolicyConfiguration</span> <span style="color: #ff0000">defaultPolicy</span><span style="color: #0000ff">=&quot;FixedIntervalDefault&quot;</span> <span style="color: #ff0000">defaultSqlConnectionPolicy</span><span style="color: #0000ff">=&quot;FixedIntervalDefault&quot;</span> <br />         <span style="color: #ff0000">defaultSqlCommandPolicy</span><span style="color: #0000ff">=&quot;FixedIntervalDefault&quot;</span> <span style="color: #ff0000">defaultStoragePolicy</span><span style="color: #0000ff">=&quot;IncrementalIntervalDefault&quot;</span> <br />         <span style="color: #ff0000">defaultCommunicationPolicy</span><span style="color: #0000ff">=&quot;IncrementalIntervalDefault&quot;</span><span style="color: #0000ff">&gt;</span><br />    <span style="color: #0000ff">&lt;</span><span style="color: #800000">add</span> <span style="color: #ff0000">name</span><span style="color: #0000ff">=&quot;FixedIntervalDefault&quot;</span> <span style="color: #ff0000">maxRetryCount</span><span style="color: #0000ff">=&quot;10&quot;</span> <span style="color: #ff0000">retryInterval</span><span style="color: #0000ff">=&quot;100&quot;</span> <span style="color: #0000ff">/&gt;</span><br />    <span style="color: #0000ff">&lt;</span><span style="color: #800000">add</span> <span style="color: #ff0000">name</span><span style="color: #0000ff">=&quot;IncrementalIntervalDefault&quot;</span> <span style="color: #ff0000">maxRetryCount</span><span style="color: #0000ff">=&quot;10&quot;</span> <span style="color: #ff0000">retryInterval</span><span style="color: #0000ff">=&quot;100&quot;</span> <span style="color: #ff0000">retryIncrement</span><span style="color: #0000ff">=&quot;50&quot;</span> <span style="color: #0000ff">/&gt;</span><br />    <span style="color: #0000ff">&lt;</span><span style="color: #800000">add</span> <span style="color: #ff0000">name</span><span style="color: #0000ff">=&quot;ExponentialIntervalDefault&quot;</span> <span style="color: #ff0000">maxRetryCount</span><span style="color: #0000ff">=&quot;10&quot;</span> <span style="color: #ff0000">minBackoff</span><span style="color: #0000ff">=&quot;100&quot;</span> <span style="color: #ff0000">maxBackoff</span><span style="color: #0000ff">=&quot;1000&quot;</span> <span style="color: #ff0000">deltaBackoff</span><span style="color: #0000ff">=&quot;100&quot;</span> <span style="color: #0000ff">/&gt;</span><br /><span style="color: #0000ff">&lt;/</span><span style="color: #800000">RetryPolicyConfiguration</span><span style="color: #0000ff">&gt;</span></pre>
<p></div>
<p>This defines a new section in your web.config, then implements it with several different retry policies include a default one which seems quite reasonable to me.</p>
<p>If you remember, in the implementation section above, we used a public class called RetryUtils.&#160; This class is actually one I invented as a convenience class to minimize the code I have to update on each use of the ReliableConnection Object.&#160; Just to refresh your memory, the implementation is this:</p>
<div id="codeSnippetWrapper">
<pre style="border-bottom-style: none; text-align: left; padding-bottom: 0px; line-height: 12pt; border-right-style: none; background-color: #f4f4f4; margin: 0em; padding-left: 0px; width: 100%; padding-right: 0px; font-family: &#39;Courier New&#39;, courier, monospace; direction: ltr; border-top-style: none; color: black; font-size: 8pt; border-left-style: none; overflow: visible; padding-top: 0px" id="codeSnippet"><span style="color: #0000ff">using</span> (var sqlConnection =<br />                <span style="color: #0000ff">new</span> ReliableSqlConnection(<br />                    ConfigurationManager.ConnectionStrings[<span style="color: #006080">&quot;CRStorageWebConnectionString&quot;</span>].<br />                    ConnectionString,<br />                    <span style="color: #0000ff">new</span> RetryUtils(<span style="color: #006080">&quot;&quot;</span>, <span style="color: #006080">&quot;UsersIdFromUserName&quot;</span>).GetRetryPolicy()))</pre>
<p></div>
<p>The actual code fo rthe class RetryUtils is below here.&#160; You’ll have to stick this someplace in your project.</p>
<div>
<pre style="border-bottom-style: none; text-align: left; padding-bottom: 0px; line-height: 12pt; border-right-style: none; background-color: #f4f4f4; margin: 0em; padding-left: 0px; width: 100%; padding-right: 0px; font-family: &#39;Courier New&#39;, courier, monospace; direction: ltr; border-top-style: none; color: black; font-size: 8pt; border-left-style: none; overflow: visible; padding-top: 0px" id="codeSnippet"><span style="color: #0000ff">namespace</span> Utils<br />{<br />   <br />    <span style="color: #0000ff">public</span> <span style="color: #0000ff">class</span> RetryUtils<br />    {<br />        <span style="color: #0000ff">public</span> <span style="color: #0000ff">string</span> Username { get; set; }<br />        <span style="color: #0000ff">public</span> <span style="color: #0000ff">string</span> CallersName { get; set; }<br /><br />        <span style="color: #0000ff">public</span> RetryUtils(<span style="color: #0000ff">string</span> username, <span style="color: #0000ff">string</span> callersName)<br />        {<br />            Username = username;<br />            CallersName = callersName;<br />        }<br /><br />        <span style="color: #0000ff">public</span> RetryUtils()<br />        {<br />            Username = <span style="color: #0000ff">string</span>.Empty;<br />            CallersName = <span style="color: #0000ff">string</span>.Empty;<br />        }<br /><br />        <span style="color: #0000ff">public</span> RetryPolicy&lt;SqlAzureTransientErrorDetectionStrategy&gt; GetRetryPolicy()<br />        {<br />            var retryPolicy = <span style="color: #0000ff">new</span> RetryPolicy&lt;SqlAzureTransientErrorDetectionStrategy&gt;<br />                 (RetryPolicy.DefaultClientRetryCount, RetryPolicy.DefaultMinBackoff,<br />                  RetryPolicy.DefaultMaxBackoff,<br />                  RetryPolicy.DefaultClientBackoff);<br /><br />            retryPolicy.RetryOccurred += RetryPolicyRetryOccurred;<br /><br />            <span style="color: #0000ff">return</span> retryPolicy;<br />        }<br /><br />        <span style="color: #0000ff">void</span> RetryPolicyRetryOccurred(<span style="color: #0000ff">int</span> currentRetryCount, Exception lastException, TimeSpan delay)<br />        {<br />            GeneralUtils.GetLog4NetAllDataContext().AddLog4NetAll(<span style="color: #0000ff">new</span> Log4NetAll<br />                                                    {<br />                                                        Date = DateTime.UtcNow,<br />                                                        EllapsedTime = 0,<br />                                                        ExceptionStackTrace = lastException.StackTrace,<br />                                                        Message = <span style="color: #006080">&quot;RetryCount: &quot;</span> + currentRetryCount + <span style="color: #006080">&quot; delay: &quot;</span> + delay.Seconds,<br />                                                        ExceptionMessage = lastException.Message,<br />                                                        Logger = <span style="color: #006080">&quot;&quot;</span>,<br />                                                        Level = <span style="color: #006080">&quot;Error&quot;</span>,<br />                                                        UserName = Username,<br />                                                        PartitionKey = Username,<br />                                                        RowKey = Guid.NewGuid().ToString()<br />                                                    });<br />        }       <br />    }<br />}<br /></pre>
</div>
<div>This code actually has the nice callback delegate that does the logging when a retry actually occurs.&#160; I’m not including my implementation of GeneralUtils.GetLog4NetAllDataContext().AddLog4NetAll, but you can pretty much guess what it does.&#160; It simply logs the retry with all the details of what happened.&#160; My implementation sticks this in an Azure Table, but that’s really for another post.</div>
<div>&#160;</div>
<h2>Non Connection Related Errors</h2>
<div>&#160;</div>
<div>Remember, our second design criteria is that we should only fail on errors that are connection related and not things like data column not found.&#160; With no additional work, this library takes care of this for us.&#160; Actually, in the release notes for the 1.3 release (which I have not used yet) say they have improved that feature by adding additional codes not to fail on.&#160; That is, the last thing you want is your code spending 5 minutes retrying on a problem you’d just like reported immediately. </div>
<div>&#160;</div>
<div>Keep in mind that the library we are using here is a general purpose retry library not designed just for use with ado.net.&#160; The team has provided us with examples using LINQ2SQL, EntityFramework and other technologies.&#160; I spent&#160; a little time reading about using those other technologies but did not get far enough to blog about it.&#160; My current SqlAzure implementation uses 100% ado.net because performance is critical to me and neither EF or LINQ2SQL are quite up to my task yet.</div>
<div>&#160;</div>
<h2>Conclusions</h2>
<div>&#160;</div>
<div>So basically, that’s it!&#160; You know have the tools to implement very nice retry logic in your ado.net code so Azure will not fail on “normal” connection failures.&#160; I suggest that if you are using SqlAzure, you implement this as soon as possible so your code will be solid going forward.</div>
<div>&#160;</div>
<div>Thanks for reading!</div>